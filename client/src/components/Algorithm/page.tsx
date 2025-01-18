import React, { useMemo, useState } from "react";
import axios from "axios";
import "./styles/ToxicityChecker.css";

interface ToxicText {
  text: string;
  sentence: string;
  reason: string;
}

interface ToxicityResponse {
  toxicityScore: number;
  toxicityLabel: string;
  otherAttributes?: any;
  toxicText: ToxicText[];
  englishText: string;
}

const TextInputWithDangerScore: React.FC = () => {
  const [inputText, setInputText] = useState("");
  const [englishText, setEnglishText] = useState("");
  const [toxicityScore, setToxicityScore] = useState<number | null>(null);
  const [toxicityLabel, setToxicityLabel] = useState<string | null>(null);
  const [otherAttributes, setOtherAttributes] = useState<any>(null);
  const [toxicWordsList, setToxicWordsList] = useState<ToxicText[]>([]);
  const [activeWord, setActiveWord] = useState<ToxicText | null>(null);
  const [loading, setLoading] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [nonToxicText, setNonToxicText] = useState<string | null>(null);

  const isToxic = useMemo(() => toxicWordsList.length > 0, [toxicWordsList]);

  const getScoreLevel = (score: number) => {
    if (score <= 0.3) return "high";
    if (score <= 0.7) return "medium";
    return "low";
  };

  const highlightToxicWords = (text, toxicWords) => {
    let highlightedText = "";
    let currentIndex = 0;

    toxicWords.forEach(({ text: toxicWord }) => {
      const wordIndex = text.indexOf(toxicWord, currentIndex);
      if (wordIndex !== -1) {
        // Append text before the toxic word
        highlightedText += text.slice(currentIndex, wordIndex);
        // Append the toxic word wrapped in a span
        highlightedText += `<span class="toxic-word" data-text='${toxicWord}'>${toxicWord}</span>`;
        currentIndex = wordIndex + toxicWord.length;
      }
    });
    // Append the remaining text
    highlightedText += text.slice(currentIndex);
    return highlightedText;
  };

  // Handle clicks on toxic words
  const handleWordClick = (word: string) => {
    const toxicWord = toxicWordsList.find(
      ({ text }) => text.toLowerCase() === word.toLowerCase()
    );
    if (toxicWord) {
      setActiveWord((prev) =>
        prev?.text.toLowerCase() === word.toLowerCase() ? null : toxicWord
      );
    }
  };

  // Sends the input text to the backend API for toxicity analysis
  const getDangerScore = async (text: string) => {
    setLoading(true);
    setToxicityScore(null);
    setToxicityLabel(null);
    setOtherAttributes(null);
    setToxicWordsList([]);
    setActiveWord(null);
    setShowAnalysis(false);
    setNonToxicText(null);

    try {
      const response = await axios.post<ToxicityResponse>(
        "http://localhost:5001/api/toxicity-check",
        { text: text.trim() }
      );

      const {
        toxicityScore,
        toxicityLabel,
        otherAttributes,
        toxicText,
        englishText,
      } = response.data;

      console.log("the english text is", englishText);

      setToxicityScore(toxicityScore);
      setToxicityLabel(toxicityLabel);
      setOtherAttributes(otherAttributes);
      setToxicWordsList(toxicText || []);
      setEnglishText(englishText);
      setShowAnalysis(true);
    } catch (err) {
      console.error("Error with toxicity analysis:", err);
      setToxicityScore(1);
    } finally {
      setLoading(false);
    }
  };

  // Function to fetch non-toxic text
  const getNonToxicText = async () => {
    try {
      const response = await axios.post(
        "http://localhost:5001/api/generate-non-toxic",
        { text: inputText }
      );

      const nonToxicWithBreaks = response.data.nonToxicText.replaceAll(
        "\n",
        "<br/>"
      );
      setNonToxicText(nonToxicWithBreaks);
    } catch (error) {
      console.error("Error generating non-toxic text:", error);
    }
  };

  return (
    <div className="toxicity-checker">
      <h2>Internet Safety Checker</h2>
      <div className="center-container">
        <textarea
          className="toxicity-input"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Enter your conversation here to check if it's safe..."
        />
      </div>
      <button
        className={`button ${loading ? "loading" : ""}`}
        onClick={() => getDangerScore(inputText)}
        disabled={loading}
      >
        {loading ? "Analyzing..." : "Check Safety Score"}
      </button>

      {showAnalysis && (
        <div className="analysis-section">
          <div className="score-display">
            <h3
              data-score={
                toxicityScore ? getScoreLevel(toxicityScore) : undefined
              }
            >
              Safety Score:{" "}
              {toxicityScore !== null
                ? `${(100 - toxicityScore * 100).toFixed(0)}%`
                : "N/A"}
            </h3>
            <h3>Safety Level: {toxicityLabel || "N/A"}</h3>
          </div>

          {otherAttributes && Object.keys(otherAttributes).length > 0 && (
            <div className="score-display">
              <h3>Detected Issues:</h3>
              {Object.keys(otherAttributes)
                .filter((key) => {
                  const score = otherAttributes[key]?.summaryScore?.value;
                  return score !== undefined && score > 0.55;
                })
                .map((key) => (
                  <p key={key}>
                    <strong>{key}</strong>:{" "}
                    {(otherAttributes[key]?.summaryScore?.value * 100).toFixed(
                      0
                    )}
                    %
                  </p>
                ))}
            </div>
          )}

          <div className="score-display">
            <h3>Analysis Results</h3>
            {toxicityScore !== null && toxicityScore <= 0.55 ? (
              <p>This conversation appears to be safe! 👍</p>
            ) : (
              <div
                dangerouslySetInnerHTML={{
                  __html: highlightToxicWords(englishText, toxicWordsList),
                }}
                onClick={(e) => {
                  const target = e.target as HTMLSpanElement;
                  if (target.classList.contains("toxic-word")) {
                    const word = target.getAttribute("data-text") || "";
                    handleWordClick(word);
                  }
                }}
              />
            )}
          </div>

          {activeWord && (
            <div className="toxic-word-details">
              <h4>Why is "{activeWord.text}" concerning?</h4>
              <p>{activeWord.reason}</p>
            </div>
          )}

          {isToxic && (
            <>
              <button className="button" onClick={getNonToxicText}>
                Get Friendly Version
              </button>

              {nonToxicText && (
                <div className="non-toxic-version">
                  <h3>Friendly Version</h3>
                  <p dangerouslySetInnerHTML={{ __html: nonToxicText }} />
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default TextInputWithDangerScore;
