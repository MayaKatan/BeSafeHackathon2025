import React, { useState } from "react";
import axios from "axios";

interface DangerousWordsListItem {
  word: string;
  explanation: string;
}

interface ToxicityResponse {
  geminiSnippet: string;
  geminiFullExplanation: string;
  toxicityScore: number;
  toxicityLabel: string;
  otherAttributes?: any;
  dangerousWordsList?: DangerousWordsListItem[];
}

const TextInputWithDangerScore: React.FC = () => {
  const [inputText, setInputText] = useState("");
  const [toxicityScore, setToxicityScore] = useState<number | null>(null);
  const [toxicityLabel, setToxicityLabel] = useState<string | null>(null);
  const [otherAttributes, setOtherAttributes] = useState<any>(null);

  const [geminiSnippet, setGeminiSnippet] = useState<string>("");
  const [toxicWordsList, setToxicWordsList] = useState<
    DangerousWordsListItem[]
  >([]);
  const [activeWord, setActiveWord] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [geminiFullExplanation, setGeminiFullExplanation] =
    useState<string>("");

  // Handle clicks on toxic words
  const handleSnippetClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;

    if (target.classList.contains("toxic-word")) {
      const word = target.getAttribute("data-word");
      if (word) {
        setActiveWord((prev) => (prev === word ? null : word));
      }
    }
  };

  // Sends the input text to the backend API for toxicity analysis
  const getDangerScore = async (text: string) => {
    setLoading(true);
    setToxicityScore(null);
    setToxicityLabel(null);
    setOtherAttributes(null);
    setGeminiSnippet("");
    setGeminiFullExplanation("");
    setToxicWordsList([]);
    setActiveWord(null);

    try {
      const response = await axios.post<ToxicityResponse>(
        "http://localhost:5001/api/toxicity-check",
        { text: text.trim() }
      );

      const {
        geminiSnippet,
        geminiFullExplanation,
        toxicityScore,
        toxicityLabel,
        otherAttributes,
        dangerousWordsList,
      } = response.data;

      //console.log("Received Other Attributes:", otherAttributes);

      setGeminiSnippet(geminiSnippet || "");
      setGeminiFullExplanation(geminiFullExplanation || "");
      setToxicityScore(toxicityScore);
      setToxicityLabel(toxicityLabel);
      setOtherAttributes(otherAttributes);
      setToxicWordsList(dangerousWordsList || []);
    } catch (err) {
      console.error("Error with toxicity analysis:", err);
      setToxicityScore(1);
    } finally {
      setLoading(false);
    }
  };

  // Finds and returns the explanation for the currently active toxic word by matching it with the toxicWordsList.
  const getActiveExplanation = (): string | null => {
    if (!activeWord) return null;

    // Remove trailing punctuation from the active word
    const cleanedWord = activeWord
      .trim()
      .replace(/[.,!?]$/, "")
      .toLowerCase();

    // Match the cleaned word with the toxicWordsList
    const item = toxicWordsList.find(
      (toxicWord) => toxicWord.word.toLowerCase() === cleanedWord
    );

    return item?.explanation || "No explanation found for this word.";
  };

  return (
    <div style={{ maxWidth: 600, paddingBottom: "5rem" }}>
      <h2>How toxic is your text?</h2>
      <textarea
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
        rows={4}
        cols={50}
        placeholder="Enter text to analyze"
      />
      <br />
      <button onClick={() => getDangerScore(inputText)} disabled={loading}>
        {loading ? "Analyzing..." : "Check Toxicity Score"}
      </button>

      <div style={{ marginTop: "1rem" }}>
        <h3>
          Toxicity Score:{" "}
          {toxicityScore !== null ? toxicityScore.toFixed(2) : "N/A"}
        </h3>
        <h3>Toxicity Label: {toxicityLabel || "N/A"}</h3>
      </div>

      <div>
        <h3>Other Attributes:</h3>
        {toxicityLabel === "Non-toxic" ||
        !otherAttributes ||
        Object.keys(otherAttributes).length === 0 ? (
          <p>No significant attributes detected.</p>
        ) : (
          Object.keys(otherAttributes)
            .filter((key) => {
              const score = otherAttributes[key]?.summaryScore?.value;
              return score !== undefined && score > 0.55;
            })
            .map((key) => (
              <p key={key}>
                <strong>{key}</strong>:{" "}
                {otherAttributes[key]?.summaryScore?.value.toFixed(2)}
              </p>
            ))
        )}
      </div>

      <div style={{ marginTop: "1rem" }}>
        <h3>Toxicity Analysis</h3>
        {toxicityScore !== null && toxicityScore < 0.55 ? (
          <p>{geminiFullExplanation || "The text is not toxic."}</p>
        ) : geminiSnippet ? (
          <div
            dangerouslySetInnerHTML={{ __html: geminiSnippet }}
            style={{ whiteSpace: "pre-wrap", cursor: "pointer" }}
            onClick={handleSnippetClick}
          />
        ) : (
          <p>Analysis in progress.</p>
        )}
      </div>

      {activeWord && (
        <div
          style={{
            marginTop: "1rem",
            border: "1px solid #ccc",
            padding: "1rem",
            background: "#fafafa",
          }}
        >
          <h4>Explanation for {activeWord}</h4>
          <p style={{ whiteSpace: "pre-wrap" }}>{getActiveExplanation()}</p>
        </div>
      )}
    </div>
  );
};

export default TextInputWithDangerScore;
