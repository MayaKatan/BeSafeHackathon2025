import React, { useMemo, useState } from "react";
import axios from "axios";

interface ToxicText {
  text: string; // The toxic text inside the whole input text
  sentence: string; // The sentence in the whole input text that contains text
  reason: string; // The reason for toxicity in text
}

interface ToxicityResponse {
  toxicityScore: number;
  toxicityLabel: string;
  otherAttributes?: any;
  toxicText: ToxicText[];
}

const TextInputWithDangerScore: React.FC = () => {
  const [inputText, setInputText] = useState("");
  const [cleanText, setCleanText] = useState("");
  const [toxicityScore, setToxicityScore] = useState<number | null>(null);
  const [toxicityLabel, setToxicityLabel] = useState<string | null>(null);
  const [otherAttributes, setOtherAttributes] = useState<any>(null);

  const [toxicWordsList, setToxicWordsList] = useState<ToxicText[]>([]);
  const [activeWord, setActiveWord] = useState<ToxicText | null>(null);
  const [loading, setLoading] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [nonToxicText, setNonToxicText] = useState<string | null>(null);

  const isToxic = useMemo(() => toxicWordsList.length > 0, [toxicWordsList]);

  const highlightToxicWords = (text, toxicWords) => {
    let highlightedText = "";
    let currentIndex = 0;

    toxicWords.forEach(({ text: toxicWord }) => {
      const wordIndex = text.indexOf(toxicWord, currentIndex);
      if (wordIndex !== -1) {
        // Append text before the toxic word
        highlightedText += text.slice(currentIndex, wordIndex);

        // Append the toxic word wrapped in a span
        highlightedText += `<span style='color: red; font-weight: bold; cursor: pointer;' data-text='${toxicWord}'>${toxicWord}</span>`;

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
    setCleanText(text);
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

      const { toxicityScore, toxicityLabel, otherAttributes, toxicText } =
        response.data;

      setToxicityScore(toxicityScore);
      setToxicityLabel(toxicityLabel);
      setOtherAttributes(otherAttributes);
      setToxicWordsList(toxicText || []);
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
      //console.log("In the front end" + response.data.nonToxicText);

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

      <button
        type="submit"
        onClick={() => getDangerScore(inputText)}
        disabled={loading}
      >
        {loading ? "Analyzing..." : "Check Toxicity Score"}
      </button>

      {showAnalysis && (
        <>
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
            {toxicityScore !== null && toxicityScore <= 0.55 ? (
              <p>The text is not toxic.</p>
            ) : (
              <div
                dangerouslySetInnerHTML={{
                  __html: highlightToxicWords(cleanText, toxicWordsList),
                }}
                style={{ whiteSpace: "pre-wrap" }}
                onClick={(e) => {
                  const target = e.target as HTMLSpanElement;
                  if (target.tagName === "SPAN") {
                    const word = target.getAttribute("data-text") || "";
                    handleWordClick(word);
                  }
                }}
              />
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
              <h4>Why is {activeWord.text} toxic?</h4>
              <p>
                <strong>Reason:</strong> {activeWord.reason}
              </p>
            </div>
          )}

          {/* Button to Generate Non-Toxic Text */}
          <button style={{ marginTop: "1rem" }} onClick={getNonToxicText}>
            Generate Non-Toxic Version
          </button>

          {/* Display Non-Toxic Text */}
          {nonToxicText && (
            <div
              style={{
                marginTop: "1rem",
                border: "1px solid #ccc",
                padding: "1rem",
                background: "#fafafa",
              }}
            >
              <h3>Non-Toxic Version</h3>

              <p dangerouslySetInnerHTML={{ __html: nonToxicText }} />
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default TextInputWithDangerScore;
