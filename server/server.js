import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import axios from 'axios';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors({ origin: process.env.CLIENT_URL }));

/* 1) Analyze text with Perspective API */
const analyzeTextWithPerspective = async (text) => {
  if (!text || typeof text !== "string") {
    console.error("Invalid input text. Please provide a non-empty string.");
    return null;
  }

  try {
    const data = {
      clientToken: "free-text-analysis",
      comment: { text, type: "PLAIN_TEXT" },
      doNotStore: true,
      languages: ["en"],
      requestedAttributes: {
        TOXICITY: {},
        SEVERE_TOXICITY: {},
        INSULT: {},
        THREAT: {},
        SEXUALLY_EXPLICIT: {},
        IDENTITY_ATTACK: {},
        ATTACK_ON_AUTHOR: {},
      },
      spanAnnotations: true
    };

    const response = await axios.post(
      `https://commentanalyzer.googleapis.com/v1alpha1/comments:analyze?key=${process.env.PERSPECTIVE_API_KEY}`,
      data
    );

    const maxAttributeScore = Math.max(
      ...Object.values(response.data.attributeScores || {}).map(
        (attr) => attr?.summaryScore?.value || 0
      )
    );

    const toxicityLabel = maxAttributeScore >= 0.55 ? "Toxic" : "Non-toxic";

    return {
      toxicityLabel,
      toxicityScore: maxAttributeScore,
      otherAttributes: response.data.attributeScores
    };
  } catch (error) {
    console.error("Error with Perspective API:", error.response?.data || error.message);
    return null;
  }
};

/* 2) Analyze Toxic Words with Gemini */
const analyzeToxicWordsWithGemini = async (sentence, toxicityScore) => {
  console.log("Analyzing sentence with Gemini...");

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `The following sentence has been flagged as toxic (toxicity level: ${toxicityScore}). 
      Please analyze the sentence below, find the toxic words, and explain why each word is considered toxic.
      Give an explanation for a teenager but do not say that it is for a teenager.
      Format the response as follows:
      - The first sentence should always state: The text is toxic because of the word (or words if there are a couple of toxic words) 
        {write the toxic word/words} (without "" around the words), write all toxic words separated by commas.
      - Follow the first sentence with a newline, then provide the detailed explanation, each word explained in a paragraph or line starting with: The word "{word}" is ...
      If there are no toxic words, respond: 
      "The text is not toxic. Followed by a newline, then provide an explanation to why the text is not toxic."
      Sentence: "${sentence}"`;

    const result = await model.generateContent(prompt);
    const geminiFullText = result.response.text();

    console.log("Gemini Response:", geminiFullText);

    return geminiFullText;
  } catch (error) {
    console.error("Error analyzing toxic words:", error);
    throw new Error("Failed to analyze toxic words.");
  }
};

/* 3) Extract Toxic Words from First Sentence */
const extractToxicWordsFromFirstSentence = (firstLine) => {

  const match = firstLine.match(/because of the (?:word|words) (.+)/i);

  if (!match || !match[1]) {
    console.log("No toxic words found in the sentence.");
    return [];
  }

  // Split by commas and remove unnecessary conjunctions like "and"
  const words = match[1]
    .split(/,|and /)
    .map((word) => word.trim().replace(/[.]/g, "")) // Trim spaces and periods
    .filter((word) => word);

  return words.map((word) => word.toLowerCase());
};

/* 3) parseWordExplanations from Gemini */
const parseWordExplanations = (geminiFullText) => {
  const pattern = /(The (word|phrase)\s+"([^"]+)"\s+(is|refers to|acts as|means|in this phrase|in this sentence|in this context|has the meaning of)\s+.*?)(?=(The (word|phrase)\s+"|$))/gs;
  const wordExplanations = [];

  let match;
  while ((match = pattern.exec(geminiFullText)) !== null) {
    const fullChunk = match[1].trim(); // Entire explanation
    const wordOrPhrase = match[3].toLowerCase(); // Extract the toxic word/phrase
    wordExplanations.push({ word: wordOrPhrase, explanation: fullChunk });
  }

  return wordExplanations;
};

/* 4) Highlight the toxic words returned by Gemini */
const highlightWords = (snippet, toxicPhrases) => {
  let highlighted = snippet;

  toxicPhrases.forEach((phrase) => {
    // Remove surrounding quotes and trim whitespace
    const cleanPhrase = phrase.replace(/^"|"$/g, "").trim();

    // Wrap the toxic word/phrase with a span element
    highlighted = highlighted.split(cleanPhrase).join(
      `<span class="toxic-word" data-word="${cleanPhrase}" style="color: red; cursor: pointer; ">${cleanPhrase}</span>`
    );
  });

  return highlighted;
};

// Main Endpoint
app.post("/api/toxicity-check", async (req, res) => {
  const { text } = req.body;

  try {
    const perspectiveResult = await analyzeTextWithPerspective(text);
    if (!perspectiveResult) {
      return res.status(400).json({ message: "Perspective analysis failed." });
    }

    if (perspectiveResult.toxicityScore < 0.55) {
      //console.log("Not toxic");
      return res.json({
        geminiSnippet: "",
        geminiFullExplanation: "",
        toxicityScore: parseFloat(perspectiveResult.toxicityScore.toFixed(2)),
        toxicityLabel: perspectiveResult.toxicityLabel,
        otherAttributes: perspectiveResult.otherAttributes,
        dangerousWordsList: []
      });
    }

    // If toxic -> Gemini
    const geminiFullText = await analyzeToxicWordsWithGemini(
      text,
      perspectiveResult.toxicityScore
    );

    const firstLine = geminiFullText.split("\n")[0].trim();

    if (firstLine.toLowerCase().includes("the text is not toxic")) {
      const explanation = geminiFullText.split("\n").slice(1).join("\n").trim();

      return res.json({
        geminiSnippet: firstLine,
        geminiFullExplanation: explanation,
        toxicityScore: parseFloat(perspectiveResult.toxicityScore.toFixed(2)),
        toxicityLabel: "Non-toxic (Gemini)",
        otherAttributes: perspectiveResult.otherAttributes,
        dangerousWordsList: []
      });
    }

    const toxicWordsFromFirstSentence = extractToxicWordsFromFirstSentence(firstLine);

    const wordExplanations = parseWordExplanations(geminiFullText);

    const toxicWords = toxicWordsFromFirstSentence;

    const geminiSnippet = highlightWords(firstLine, toxicWords);

    const dangerousWordsList = wordExplanations.map(({ word, explanation }) => ({
      word,
      explanation
    }));

    return res.json({
      geminiSnippet,
      geminiFullExplanation: geminiFullText,
      toxicityScore: parseFloat(perspectiveResult.toxicityScore.toFixed(2)),
      toxicityLabel: perspectiveResult.toxicityLabel,
      otherAttributes: perspectiveResult.otherAttributes,
      dangerousWordsList
    });
  } catch (error) {
    console.error("Error processing text:", error);
    return res.status(500).json({ message: "Server error processing text" });
  }
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});