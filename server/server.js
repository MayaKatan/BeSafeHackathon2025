import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import axios from 'axios';
import multer from 'multer';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { TranslationServiceClient } from '@google-cloud/translate';
import { ImageAnnotatorClient } from '@google-cloud/vision';

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors({ origin: process.env.CLIENT_URL }));

const translateClient = new TranslationServiceClient();
const upload = multer();

const visionClient = new ImageAnnotatorClient({
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS_IMAGE_ANALYSER,
});

/* Function to detect language and translate Hebrew to English */
const translateToEnglish = async (text) => {
  try {
    const [detection] = await translateClient.detectLanguage({ parent: `projects/${process.env.GOOGLE_CLOUD_PROJECT_ID}`, content: text });
    const detectedLanguage = detection.languages[0].languageCode;

    // If text is in Hebrew, translate to English
    if (detectedLanguage === 'he' || detectedLanguage === 'iw') {
      const [translation] = await translateClient.translateText({
        parent: `projects/${process.env.GOOGLE_CLOUD_PROJECT_ID}`,
        contents: [text],
        targetLanguageCode: 'en',
      });


      return translation.translations[0].translatedText;

    }

    // If text is already in English, return it as-is
    return text;
  } catch (error) {
    console.error('Error detecting or translating text:', error);
    throw new Error('Failed to detect or translate text.');
  }
};

/* Function to translate text back to Hebrew */
const translateToHebrew = async (text) => {
  try {
    const [translation] = await translateClient.translateText({
      parent: `projects/${process.env.GOOGLE_CLOUD_PROJECT_ID}`,
      contents: [text],
      targetLanguageCode: 'he',
    });

    return translation.translations[0].translatedText;
  } catch (error) {
    console.error('Error translating text back to Hebrew:', error);
    throw new Error('Failed to translate text back to Hebrew.');
  }
};

// Add a helper function to detect if the input text is in Hebrew:
const isHebrew = (text) => {
  // Simple regex to detect Hebrew characters
  return /[\u0590-\u05FF]/.test(text);
};

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
    Please analyze the text below, identify the toxic words or phrases from the input text, and explain why each is considered toxic.  

    ### Requirements:  
    1. **Return Format**:  
    Provide the result as a JSON array with the following structure:  
     {
       "text": "string",        // The toxic word or phrase
       "sentence": "string",    // Context: two words before and two words after the toxic text
       "reason": "string"       // Explanation of why the text is considered toxic
     }

      text: The exact toxic word or phrase as it appears in the input text.

          Key Guidelines:
          1. **Exact Match**:
            - Copy the toxic word or phrase exactly as it is in the input text, preserving **capitalization**, punctuation, special characters, and emojis.  
            - If the toxic word is lowercase in the input, it must remain lowercase in the output. Similarly, maintain uppercase or mixed casing.

          2. **No Alteration**:
            - Do not modify, paraphrase, or interpret the toxic word or phrase in any way.
            - Avoid normalizing or changing the capitalization of the word.

            - **Examples**:  
              - **Input**: "I'm in my bag, bitch, huh"  
              - **Text**: "bitch"  
              
              - **Input**: "Bitch, please stop."  
              - **Text**: "Bitch"

          3. **Boundaries**:
            - Ensure the toxic word or phrase is isolated correctly based on the input.
            - If the toxic text is part of a longer phrase, include only the identified toxic portion, not the surrounding words.

          4. **Special Characters and Emojis**:
            - Treat special characters, punctuation marks, and emojis as integral parts of the toxic text.
            - Include them exactly as they appear in the input.

          5. **Repetition**:
            - If the same toxic word or phrase occurs multiple times in different parts of the input, list each occurrence as a separate entry.

          Note about **Toxicity Identification**:
            Toxicity is not limited to explicit offensive language. Include **subtle toxic behaviors**, such as:
            - **Sarcasm**: Comments that convey annoyance, mockery, or disdain.
            - **Passive-aggressiveness**: Indirect criticism or hostile undertones.
            - **Dismissiveness**: Belittling or ignoring others' contributions.
            - **Condescension**: Comments that undermine others' intelligence or efforts.
            - **Hostility**: Any words or phrases that create tension or conflict.

      sentence: Provide the exact context of the toxic text by including up to **two words before** and **two words after** the toxic text, along with the toxic text itself.
          
          Key Guidelines:
          1. **Exact Context**:
            - Ensure the "sentence" includes the toxic text **exactly as it appears** in the input, preserving capitalization, punctuation, and special characters.
            - Do not add or infer words that do not exist in the original text.

          2. **Edge Cases**:
            - If the toxic text is located at the **start** or **end** of a sentence, include only the words that exist in the input text.
            - If the toxic text is a **standalone sentence** (e.g., an emoji or single word), return it as the "sentence" without additional words.

          3. **Special Characters and Emojis**:
            - Treat special characters, punctuation, and emojis as individual words.
            - Include them in the "sentence" if they appear within the two-word context range.

          4. **Grammatical Accuracy**:
            - Ensure that the "sentence" remains grammatically accurate based on the input text.
            - Do not alter the structure of the sentence, even if the toxic text disrupts its grammar.

          5. **Multiple Occurrences**:
            - If the toxic text appears multiple times in the input text, create a separate entry for each occurrence, including its unique "sentence".
    
      reason: Provide a concise explanation for why the text is flagged as toxic.

          Key Guidelines:
          1. **Clarity**:
            - Use simple and straightforward language that can be easily understood by a teenager.
            - Avoid technical jargon or overly complex explanations.

          2. **Context Relevance**:
            - Clearly state why the specific word or phrase is considered toxic in the context of the input text.
            - Relate the explanation to the tone, meaning, or potential impact of the toxic text.

          3. **Specificity**:
            - Focus on the identified toxic word or phrase and avoid generalized statements about the entire text.

          4. **Conciseness**:
            - Keep the explanation brief, ideally two or three sentences.
            - Avoid repeating information or using unnecessary filler.

          5. **Audience Sensitivity**:
            - Ensure the explanation is neutral and does not perpetuate or amplify the toxic nature of the word or phrase.
            - Maintain a professional tone.
    
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
  let { text } = req.body;

  try {
    let translatedText = text
    if (isHebrew(text)) {
      translatedText = await translateToEnglish(text);  // Translate Hebrew to English
    }

    let nonToxicText = await generateNonToxicText(translatedText);

    if (isHebrew(text)) {
      nonToxicText = await translateToHebrew(nonToxicText);
    }
    return res.json({ nonToxicText });
  } catch (error) {
    console.error("Error generating non-toxic text:", error);
    return res.status(500).json({ message: "Server error generating non-toxic text" });
  }
});

// Gemini response to general query
const getGeminiResponse = async (thread) => {
  console.log("Sending text to Gemini for a response...");

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `
        A teenager has reached out with a question about online safety. Below is the conversation thread so far, including the teenager's latest question. 

        Please provide a warm, supportive, and helpful response in simple and clear language that is easy for a teenager to understand. 
        Focus on addressing the question with practical advice while encouraging safe and responsible behavior. 
        If necessary, suggest involving a trusted adult, professional, or appropriate authority for further guidance. 
        Avoid providing any information that could be sensitive, misleading, or unauthorized.

        Conversation Thread:
        "${thread}"

        Instructions for Your Response:
        1. **Language Consistency:** Your response must be in the same language as the question itself.
        2. **Inclusivity:** Do not assume the user’s gender. Write in a way that is neutral and addresses all genders.
        3. **Handling Missing Information:** If some information is unavailable (e.g., the user's hometown), acknowledge this gracefully and provide general advice without making assumptions.
        4. **Tone:** Ensure the response is empathetic, encouraging, and feels human-like.
        5. **Clarity:** Use simple, age-appropriate language suitable for teenagers.
        6. **Context:** Only use the information provided in the conversation thread. Do not infer or assume additional context.
        `;

    const result = await model.generateContent(prompt);

    const geminiResponse = result.response.text().trim();

    return geminiResponse;
  } catch (error) {
    console.error("Error getting response from Gemini:", error);
    throw new Error("Failed to get response from Gemini.");
  }
};

/* Endpoint for General Gemini Response */
app.post('/api/gemini-response', async (req, res) => {

  const { thread } = req.body;

  if (!thread || typeof thread !== 'string') {
    return res.status(400).json({ message: 'Invalid input text. Please provide a non-empty string.' });
  }

  try {
    const geminiResponse = await getGeminiResponse(thread);
    return res.json({ geminiResponse });
  } catch (error) {
    console.error("Error getting Gemini response:", error);
    return res.status(500).json({ message: 'Server error getting Gemini response' });
  }
});

// Toxicity check
app.post("/api/toxicity-check", async (req, res) => {
  let { text } = req.body;


  try {
    if (isHebrew(text)) {
      text = await translateToEnglish(text);
    }
    const perspectiveResult = await analyzeTextWithPerspective(text);
    if (!perspectiveResult) {
      return res.status(400).json({ message: "Perspective analysis failed." });
    }

    if (perspectiveResult.toxicityScore < 0.55) {
      return res.json({
        toxicityScore: parseFloat(perspectiveResult.toxicityScore.toFixed(2)),
        toxicityLabel: perspectiveResult.toxicityLabel,
        otherAttributes: perspectiveResult.otherAttributes,
        toxicText: [],
        englishText: text
      });
    }

    // If toxic -> Gemini
    let geminiFullJson = await analyzeToxicWordsWithGemini(
      text,
      perspectiveResult.toxicityScore
    );

    if (!Array.isArray(geminiFullJson) || geminiFullJson.length === 0) {
      return res.json({
        toxicityScore: parseFloat(perspectiveResult.toxicityScore.toFixed(2)),
        toxicityLabel: "Non-toxic (Gemini)",
        otherAttributes: perspectiveResult.otherAttributes,
        toxicText: [],
        englishText: text

      });
    }

    return res.json({
      toxicityScore: parseFloat(perspectiveResult.toxicityScore.toFixed(2)),
      toxicityLabel: perspectiveResult.toxicityLabel,
      otherAttributes: perspectiveResult.otherAttributes,
      toxicText: geminiFullJson,
      englishText: text
    })
  } catch (error) {
    console.error("Error processing text:", error);
    return res.status(500).json({ message: "Server error processing text" });
  }
});

app.post("/api/analyse-image-upload", upload.single("image"), async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ message: "No image file provided." });
    }

    const [safeSearchResult] = await visionClient.safeSearchDetection(file.buffer);
    const safeSearchAnnotations = safeSearchResult.safeSearchAnnotation;

    const filteredResults = Object.fromEntries(
      Object.entries(safeSearchAnnotations).filter(
        ([, likelihood]) => likelihood !== "VERY_UNLIKELY"
      )
    );

    res.json({
      safeSearch: filteredResults,
    });
  } catch (error) {
    console.error("Error analyzing image:", error);
    res.status(500).json({ message: "Server error analyzing image." });
  }
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});