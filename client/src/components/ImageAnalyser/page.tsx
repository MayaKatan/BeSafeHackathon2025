import React, { useState } from "react";
import axios from "axios";
import styles from "./page.module.css";

type SafeSearchLikelihood =
  | "UNKNOWN"
  | "VERY_UNLIKELY"
  | "UNLIKELY"
  | "POSSIBLE"
  | "LIKELY"
  | "VERY_LIKELY";

interface SafeSearchResults {
  safeSearch: Record<string, SafeSearchLikelihood>;
}

const likelihoodScores: Record<SafeSearchLikelihood, number> = {
  UNKNOWN: 0,
  VERY_UNLIKELY: 1,
  UNLIKELY: 2,
  POSSIBLE: 3,
  LIKELY: 4,
  VERY_LIKELY: 5,
};

const categoryEmojis: Record<string, string> = {
  adult: "🔞",
  spoof: "🎭",
  medical: "💉",
  violence: "⚔️",
  racy: "🔥",
};

const ImageAnalyser = () => {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [results, setResults] = useState<SafeSearchResults | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      setResults(null);
    }
  };

  const handleImageDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) {
      setSelectedImage(file);
      setResults(null);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const analyzeImage = async () => {
    setError(null);
    setResults(null);

    if (!selectedImage) {
      setError("Please select an image first.");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("image", selectedImage);

      const response = await axios.post(
        `${import.meta.env.VITE_SERVER_API_URL}/api/analyse-image-upload`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      console.log(response.data);
      setResults(response.data);
    } catch (err) {
      console.error("Error during image analysis:", err);
      setError("Failed to analyze the image. Please try again.");
    }
  };

  const renderResults = () => {
    if (!results || !results.safeSearch) return null;

    const toxicCategories = Object.entries(results.safeSearch).filter(
      ([, value]) => likelihoodScores[value] >= 2
    );

    return (
      <div>
        {/* Display the analysis or results first */}
        {toxicCategories.length === 0 ? (
          <p className={styles.resultMessage}>✨ This image looks good! ✨</p>
        ) : (
          <div className={styles.warningMessage}>
            <p>
              <strong>
                This image contains potentially unsafe content in the following
                categories:
              </strong>
            </p>
            <ul>
              {toxicCategories.map(([category, likelihood]) => (
                <li key={category}>
                  {categoryEmojis[category] || "⚠️"}{" "}
                  <strong>{category}:</strong> {likelihoodScores[likelihood]}/5
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Always display the uploaded image below the analysis */}
        {selectedImage && (
          <img
            src={URL.createObjectURL(selectedImage)}
            alt="Uploaded"
            className={styles.uploadedImage}
          />
        )}
      </div>
    );
  };

  return (
    <div className={styles.imageAnalysisContainer}>
      <h1>Image Checker</h1>

      <div
        className={styles.imageDropZone}
        onDrop={handleImageDrop}
        onDragOver={handleDragOver}
      >
        {selectedImage ? (
          <p>Selected: {selectedImage.name}</p>
        ) : (
          <p>Drop your image here</p>
        )}
      </div>

      <div className={styles.buttonContainer}>
        <label htmlFor="fileUpload" className={styles.imageButton}>
          Choose Image
        </label>
        <input
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          className={styles.fileInput}
          id="fileUpload"
        />
        <button onClick={analyzeImage} className={styles.imageButton}>
          Check Image
        </button>
      </div>

      {error && <p className={styles.errorMessage}>{error}</p>}

      {renderResults()}
    </div>
  );
};

export default ImageAnalyser;
