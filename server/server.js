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
    Please analyze the text below, identify the toxic words or phrases, and explain why each is considered toxic.  

    ### Requirements:  
    1. **Return Format**:  
    Provide the result as a JSON array with the following structure:  
     {
       "text": "string",        // The toxic word or phrase
       "sentence": "string",    // Context: two words before and two words after the toxic text
       "reason": "string"       // Explanation of why the text is considered toxic
     }

      text: The exact toxic word or phrase. Do not modify or alter the text in any way. Copy it exactly as it appears in the input.
      
      sentence: Two words before and two words after the toxic text, including the toxic text itself. Ensure the sentence remains grammatically accurate and does not add nonexistent words.
      If the toxic text appears at the start or end of a sentence, include only the words that exist in the context.
      Special characters and emojis are treated as individual words.
    
      reason: Provide a concise explanation for why the text is flagged as toxic. The explanation should be clear and easily understood by a general audience.
    
    2. **Context Rules**:   

      Preserve all punctuation, emojis, and formatting in the sentence.
      Ensure the sentence does not include words that occur before the beginning or after the end of the text.
    
    Non-Toxic Case:
      If no toxic words or phrases are identified in the text, return the following JSON:

      {
        "noToxicityReason": "string"  // A short explanation of why the text is not toxic
      }

    3. Examples: 
    
    Input: Sara goes to fuckin' university. Does she like it?

    Output:
    [
      {
        "text": "fuckin'",
        "sentence": "goes to fuckin' university.",
        "reason": "The word 'fuckin'' is considered offensive and inappropriate in formal communication."
      }
    ]

    Input: And since niggas need Megan help to make money, bitch, come be my ho (Ah). All of you bitches is weak, on the Bible.

    Output:
    [
      {
        "text": "niggas",
        "sentence": "And since niggas need Megan",
        "reason": "The word 'niggas' is a racial slur and is offensive in most contexts."
      },
      {
        "text": "bitch",
        "sentence": "make money, bitch, come",
        "reason": "The word 'bitch' is derogatory and often used to demean individuals."
      },
      {
        "text": "ho",
        "sentence": "be my ho (Ah)",
        "reason": "The word 'ho' is a slang term that is disrespectful and objectifies women."
      }
    ]

  Text for analysis: "${sentence}"
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

/* Generate Non-Toxic Text with Gemini */
const generateNonToxicText = async (text) => {
  console.log("Generating non-toxic version with Gemini...");

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `Rewrite the following text to make it completely non-toxic while preserving the original meaning:
      
      Text: "${text}"
      
      Return only the rewritten text, nothing else.`;

    const result = await model.generateContent(prompt);

    const rewrittenText = result.response.text().trim();

    return rewrittenText;

  } catch (error) {
    console.error("Error generating non-toxic text:", error);
    throw new Error("Failed to generate non-toxic text.");
  }
};

app.post("/api/generate-non-toxic", async (req, res) => {
  const { text } = req.body;

  try {
    const nonToxicText = await generateNonToxicText(text);
    return res.json({ nonToxicText });
  } catch (error) {
    console.error("Error generating non-toxic text:", error);
    return res.status(500).json({ message: "Server error generating non-toxic text" });
  }
});

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