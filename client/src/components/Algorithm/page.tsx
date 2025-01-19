import React, { useMemo, useState } from "react";
import axios from "axios";
import "./styles/ToxicityChecker.css";
import { useNavigate } from "react-router-dom";
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
  const navigate = useNavigate();

  const isToxic = useMemo(() => toxicWordsList.length > 0, [toxicWordsList]);

  const getScoreLevel = (score: number) => {
    if (score <= 0.3) return "high";
    if (score <= 0.7) return "medium";
    return "low";
  };

  /**
   * Highlights all occurrences of any unique toxic words/phrases by wrapping them in a span
   * 1) Identify single-word toxic items (use \b boundaries).
   * 2) Identify multi-word toxic items (use substring search).
   */
  function highlightToxicItems(
    originalText: string,
    toxicItems: { text: string }[]
  ) {
    const singleWords: string[] = [];
    const multiWordPhrases: string[] = [];

    for (const { text } of toxicItems) {
      const trimmed = text.trim();
      if (!trimmed) continue;

      // Check if the token is only alphanumeric/underscore
      if (/^[A-Za-z0-9_]+$/.test(trimmed)) {
        singleWords.push(trimmed);
      } else {
        multiWordPhrases.push(trimmed);
      }
    }

    const singleWordMatches = findSingleWordMatches(originalText, singleWords);

    const phraseMatches = findPhraseMatches(originalText, multiWordPhrases);

    const allMatches = [...singleWordMatches, ...phraseMatches];

    if (allMatches.length === 0) {
      // No matches => just return text with line breaks/spaces replaced
      return originalText
        .replace(/\n/g, "<br/>")
        .replace(/ {2}/g, "&nbsp;&nbsp;");
    }

    // Sort matches by start index -> no overlap/missing words
    allMatches.sort((a, b) => a.start - b.start);

    let highlightedText = "";
    let currentIndex = 0;
    for (const match of allMatches) {
      highlightedText += originalText.slice(currentIndex, match.start);
      highlightedText += `<span class="toxic-word" data-text="${match.matched}">${match.matched}</span>`;
      currentIndex = match.end;
    }
    highlightedText += originalText.slice(currentIndex);

    highlightedText = highlightedText
      .replace(/\n/g, "<br/>")
      .replace(/ {2}/g, "&nbsp;&nbsp;");

    return highlightedText;
  }

  //Whole-word matches for alphanumeric tokens using \b boundaries.
  function findSingleWordMatches(
    text: string,
    words: string[]
  ): Array<{ start: number; end: number; matched: string }> {
    if (!words.length) return [];

    const unique = Array.from(new Set(words.map((w) => w.toLowerCase())));

    // Escapes special characters in the words
    const escaped = unique.map(escapeRegExp);

    // Creates a regular expression pattern for matching the words
    const pattern = new RegExp(`\\b(?:${escaped.join("|")})\\b`, "gi");

    const matches: Array<{ start: number; end: number; matched: string }> = [];
    // Special type of array returned by the exec() method on a regular expression
    let matchResult: RegExpExecArray | null;

    while ((matchResult = pattern.exec(text)) !== null) {
      matches.push({
        start: matchResult.index,
        end: matchResult.index + matchResult[0].length,
        matched: matchResult[0],
      });
    }

    return matches;
  }

  // Exact substring matching for multi-word phrases, punctuation, or emojis
  function findPhraseMatches(
    originalText: string,
    phrases: string[]
  ): Array<{ start: number; end: number; matched: string }> {
    const results: Array<{ start: number; end: number; matched: string }> = [];

    if (!phrases.length) return results;

    const lowerText = originalText.toLowerCase();

    for (const phrase of phrases) {
      const lowerPhrase = phrase.toLowerCase();
      let searchIndex = 0;

      while (true) {
        const foundIndex = lowerText.indexOf(lowerPhrase, searchIndex);
        if (foundIndex === -1) break;

        const matched = originalText.slice(
          foundIndex,
          foundIndex + phrase.length
        );

        results.push({
          start: foundIndex,
          end: foundIndex + phrase.length,
          matched,
        });

        searchIndex = foundIndex + phrase.length;
      }
    }

    return results;
  }

  // Escape special characters for safe usage in a RegExp pattern.
  function escapeRegExp(str: string) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  // Handle clicks on toxic words
  const handleWordClick = (word: string) => {
    const toxicWord = toxicWordsList.find(
      ({ text }) => text.toLowerCase() === word.toLowerCase()
    );

    if (toxicWord) {
      setActiveWord((prev) =>
        // Optional chaining ensures this check does not throw an error if prev is null
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
        `${import.meta.env.VITE_SERVER_API_URL}/api/toxicity-check`,
        { text: text.trim() }
      );

      const {
        toxicityScore,
        toxicityLabel,
        otherAttributes,
        toxicText,
        englishText,
      } = response.data;

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
        `${import.meta.env.VITE_SERVER_API_URL}/api/generate-non-toxic`,
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
      <button className="corner-button" onClick={() => navigate("/")}>
        Back to Home Page
      </button>
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
              {/* Filters the keys of otherAttributes to find attributes that have a summaryScore.value defined
              and greater than 0.55. */}
              {Object.keys(otherAttributes)
                .filter((key) => {
                  const score = otherAttributes[key]?.summaryScore?.value;
                  return score !== undefined && score > 0.55;
                })
                .map((key) => (
                  // Maps over the filtered keys, converts from decimal to percentage and rounds to the nearest whole number
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
                  __html: highlightToxicItems(englishText, toxicWordsList),
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
