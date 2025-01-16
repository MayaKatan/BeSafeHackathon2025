import React, { useState, useRef, useEffect } from "react";
import { flowData } from "./flowData";
import axios from "axios";

const Bot: React.FC = () => {
  const [currentId, setCurrentId] = useState<string | null>("1");
  const [history, setHistory] = useState<string[]>([]);
  const [messages, setMessages] = useState<
    { sender: "bot" | "user"; text: string }[]
  >([{ sender: "bot", text: "איך אפשר לעזור לך?" }]);
  const [customQuestion, setCustomQuestion] = useState<string>("");
  const [isOther, setIsOther] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const currentQuestion = flowData.find(
    (question) => question.id === currentId
  );

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Adds a new bot message to the conversation with a delay
  const delayMessage = (message: string) => {
    setTimeout(() => {
      setMessages((prev) => {
        // Prevent duplicate bot messages
        if (prev.find((msg) => msg.text === message && msg.sender === "bot")) {
          return prev;
        }

        const updatedMessages: { sender: "bot" | "user"; text: string }[] = [
          ...prev,
          { sender: "bot", text: message },
        ];

        // Check if the message is one of the predefined answers
        const isPredefinedAnswer = flowData.some(
          (question) =>
            question.question === message ||
            question.options?.some((option) => option.text === message)
        );

        if (!isPredefinedAnswer) {
          updatedMessages.push({
            sender: "bot",
            text: "אם אתה צריך עזרה נוספת, אני כאן לעזור!",
          });
        }

        return updatedMessages;
      });
    }, 500);
  };

  // Handles user selections, updates the history, and determines the next question or action based on the selected option
  const handleOptionClick = (option: any) => {
    // Save current ID to history for "Back" functionality
    setHistory((prev) => [...prev, currentId!]);

    setMessages((prev) => [...prev, { sender: "user", text: option.text }]);

    if (option.text === "אחר") {
      setIsOther(true);
      return;
    }

    if (option.link) {
      delayMessage(`מעביר אותך לעמוד!`);
      setTimeout(() => {
        window.location.href = option.link;
      }, 1000);
      return;
    }

    if (option.explanation) {
      delayMessage(option.explanation);
    }

    // Find the next question based on parentId
    const nextQuestion = flowData.find((q) => q.parentId === option.id);

    if (nextQuestion) {
      setTimeout(() => {
        setCurrentId(nextQuestion.id);
        delayMessage(nextQuestion.question);
      }, 500);
    }
  };

  // Sends the user's custom question to an external API Gemini
  const handleSendToGemini = async () => {
    if (!customQuestion.trim()) {
      setMessages((prev) => [
        ...prev,
        { sender: "bot", text: "אנא הקלד טקסט." },
      ]);
      return;
    }

    setMessages((prev) => [...prev, { sender: "user", text: customQuestion }]);
    setIsLoading(true);

    const messageThread = messages
      .map((msg) => `${msg.sender === "bot" ? "Bot" : "User"}: ${msg.text}`)
      .join("\n");

    const thread = `${messageThread}\nUser: ${customQuestion}`;

    console.log(messageThread);
    console.log(customQuestion);

    try {
      const res = await axios.post(
        "http://localhost:5001/api/gemini-response",
        { thread },
        { headers: { "Content-Type": "application/json" } }
      );

      delayMessage(res.data.geminiResponse);
    } catch (error) {
      delayMessage("אנו מצטערים, היה שגיאה בשליחת השאלה. אנא נסה שוב.");
    } finally {
      setIsLoading(false);
      setCustomQuestion("");
    }
  };

  // Navigates to the previous question in history
  const handleBack = () => {
    const tempHistory = [...history];
    let lastQuestionId: string | null = null;

    while (tempHistory.length > 0) {
      lastQuestionId = tempHistory.pop() || null;

      if (lastQuestionId && lastQuestionId !== currentId) {
        setHistory(tempHistory);
        setCurrentId(lastQuestionId);

        const previousQuestion = flowData.find(
          (question) => question.id === lastQuestionId
        );

        if (previousQuestion) {
          delayMessage(previousQuestion.question);
          return;
        } else {
          delayMessage("שגיאה: לא נמצא שאלה קודמת תואמת."); // Will not actually happen
          return;
        }
      }
    }
  };

  return (
    <div
      dir="rtl"
      style={{
        maxWidth: "600px",
        margin: "0 auto",
        padding: "1rem",
        fontFamily: "Arial, sans-serif",
        direction: "rtl",
        textAlign: "right",
        border: "1px solid #ddd",
        borderRadius: "10px",
        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
      }}
    >
      <h2 style={{ textAlign: "center" }}>בוט תמיכה</h2>
      <div
        style={{
          height: "400px",
          overflowY: "auto",
          border: "1px solid #ccc",
          borderRadius: "10px",
          padding: "1rem",
          backgroundColor: "#f9f9f9",
          direction: "rtl",
        }}
      >
        {messages.map((msg, index) => (
          <div
            key={index}
            style={{
              textAlign: msg.sender === "bot" ? "right" : "left",
              margin: "0.5rem 0",
              direction: "rtl",
            }}
          >
            {msg.sender === "bot" && isOther ? (
              <div
                dangerouslySetInnerHTML={{ __html: msg.text }}
                style={{
                  display: "inline-block",
                  padding: "0.5rem 1rem",
                  borderRadius: "10px",
                  backgroundColor: "#e1f5fe",
                  color: "#333",
                  whiteSpace: "pre-wrap",
                  textAlign: "right",
                }}
              />
            ) : (
              <div
                style={{
                  display: "inline-block",
                  padding: "0.5rem 1rem",
                  borderRadius: "10px",
                  backgroundColor: msg.sender === "bot" ? "#e1f5fe" : "#c8e6c9",
                  color: "#333",
                  whiteSpace: "pre-wrap",
                  textAlign: "right",
                }}
              >
                {msg.text}
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {isOther && (
        <div style={{ marginTop: "1rem", direction: "rtl" }}>
          <textarea
            value={customQuestion}
            onChange={(e) => setCustomQuestion(e.target.value)}
            placeholder="כתוב כאן את השאלה שלך"
            style={{
              width: "100%",
              height: "80px",
              padding: "0.5rem",
              border: "1px solid #ccc",
              borderRadius: "5px",
              direction: "rtl",
              textAlign: "right",
            }}
          />
          <button
            onClick={handleSendToGemini}
            style={{
              marginTop: "0.5rem",
              padding: "0.5rem 1rem",
              backgroundColor: "#007bff",
              color: "white",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
            }}
          >
            שליחה
          </button>
          <button
            onClick={() => setIsOther(false)} // Exit "Other" mode
            style={{
              marginTop: "0.5rem",
              marginLeft: "0.5rem",
              padding: "0.5rem 1rem",
              backgroundColor: "#ff6b6b",
              color: "white",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
            }}
          >
            סיימתי
          </button>
        </div>
      )}

      {!isOther && currentQuestion && (
        <div style={{ marginTop: "1rem", direction: "rtl" }}>
          {currentQuestion.options.map((option) => (
            <button
              key={option.id}
              onClick={() => handleOptionClick(option)}
              style={{
                display: "block",
                width: "100%",
                margin: "0.5rem 0",
                padding: "0.5rem",
                border: "1px solid #ccc",
                borderRadius: "5px",
                backgroundColor: "#fff",
                textAlign: "right",
                cursor: "pointer",
                direction: "rtl",
              }}
            >
              {option.text}
            </button>
          ))}
        </div>
      )}

      {history.length > 0 && !isOther && (
        <button
          onClick={handleBack}
          style={{
            marginTop: "1rem",
            padding: "0.5rem 1rem",
            backgroundColor: "#ffc107",
            color: "#333",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
          }}
        >
          חזור לשאלה הקודמת
        </button>
      )}

      {isLoading && (
        <div
          style={{
            textAlign: "center",
            marginTop: "1rem",
            fontStyle: "italic",
            color: "#888",
            direction: "rtl",
          }}
        >
          טוען...
        </div>
      )}
    </div>
  );
};

export default Bot;
