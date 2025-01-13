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

    const prompt = `The following text has been flagged as toxic (toxicity level: ${toxicityScore}). 
      Please analyze the text below, find the toxic words, and explain why each word is considered toxic.
      Give an explanation for a teenager but do not say that it is for a teenager.
      
      Please return the answer as a json array that looks like this:
      {
      text: string;
      sentence: string;
      reason: string;
      }

      Text is the toxic part and can be either a word or a phrase. Do not change the Text itself in any way, copy it as is.

      Sentence is two words before and two words after the Text itself (no more than two words on each side), including the Text itself between the words.
      If the range of two words to the left and to the right of the Text is before the beginning of a sentence or after the end of 
      a sentence, do not add words that do not exist (crucial) or words before the sentence begins or after the sentence ends (a sentence ends after a '.'/'!'/'?' etc).
      Similarly, it the Text is at the beginning or end of a Sentence or is a sentence in itself, do not add words to the left and right of it.
      A special character is counted as a word, do not remove it. 
      An emoji can be a sentence in itself but also a part of a sentence.

      For example: Sara goes to fuckin' university. Does she like it?
      text: fucking
      sentence: goes to fuckin' university.
      
      If there are no toxic words/phrases, return the following json:

      {
      noToxicityReason: string
      }
      
      Text: "${sentence}"
      `;

    const result = await model.generateContent(prompt);

    const rawResponse = result.response.text().trim();
    const cleanedResponse = rawResponse.replace(/```json|```/g, "");
    const geminiFullJson = JSON.parse(cleanedResponse);

    console.log("Gemini Response:", geminiFullJson);

    return geminiFullJson;

  } catch (error) {
    console.error("Error analyzing toxic words:", error);
    throw new Error("Failed to analyze toxic words.");
  }
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
      return res.json({
        toxicityScore: parseFloat(perspectiveResult.toxicityScore.toFixed(2)),
        toxicityLabel: perspectiveResult.toxicityLabel,
        otherAttributes: perspectiveResult.otherAttributes,
        toxicText: []
      });
    }

    // If toxic -> Gemini
    const geminiFullJson = await analyzeToxicWordsWithGemini(
      text,
      perspectiveResult.toxicityScore
    );

    if (!Array.isArray(geminiFullJson) || geminiFullJson.length === 0) {
      return res.json({
        toxicityScore: parseFloat(perspectiveResult.toxicityScore.toFixed(2)),
        toxicityLabel: "Non-toxic (Gemini)",
        otherAttributes: perspectiveResult.otherAttributes,
        toxicText: []
      });
    }

    return res.json({
      toxicityScore: parseFloat(perspectiveResult.toxicityScore.toFixed(2)),
      toxicityLabel: perspectiveResult.toxicityLabel,
      otherAttributes: perspectiveResult.otherAttributes,
      toxicText: geminiFullJson
    })
  } catch (error) {
    console.error("Error processing text:", error);
    return res.status(500).json({ message: "Server error processing text" });
  }
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});