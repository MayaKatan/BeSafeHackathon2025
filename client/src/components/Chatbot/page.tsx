import React, { useState, useRef, useEffect } from "react";
import { flowData } from "./flowData";
import axios from "axios";
import './Bot.css';


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
  }, [messages]
);



  const delayMessage = (message: string) => {
    setTimeout(() => {
      setMessages((prev) => {
        if (prev.find((msg) => msg.text === message && msg.sender === "bot")) {
          return prev;
        }

        const updatedMessages: { sender: "bot" | "user"; text: string }[] = [
          ...prev,
          { sender: "bot", text: message },
        ];

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

  const handleOptionClick = (option: any) => {
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

    const nextQuestion = flowData.find((q) => q.parentId === option.id);

    if (nextQuestion) {
      setTimeout(() => {
        setCurrentId(nextQuestion.id);
        delayMessage(nextQuestion.question);
      }, 500);
    }
  };

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

    try {
      const url = 'http://localhost:5000/api/gemini-response';
      const res = await axios.post(
      url,//api/gemini-response`,
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
          delayMessage("שגיאה: לא נמצא שאלה קודמת תואמת.");
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
        fontFamily: "'Roboto', sans-serif", // Friendly font
        direction: "rtl",
        textAlign: "right",
        border: "1px solid #B3D7FF", // Light blue border
        borderRadius: "10px",
        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
      }}

      
    >
         <button
        onClick={() => window.location.href = 'MyProject.html'}
        style={{
          position: "absolute",
          top: "10px",
          left: "10px",
          padding: "0.5rem 1rem",
          backgroundColor: "#3B74B5", 
          color: "white",
          border: "none",
          borderRadius: "5px",
          cursor: "pointer",
          fontSize: "0.8rem", 
        }}
      >
        חזרה לעמוד הקודם
      </button>
      <h2 style={{ textAlign: "center",fontFamily: "'Assistant', 'Rubik', sans-serif",fontSize: "2.5rem", color: "#3B74B5"}}>בוט תמיכה</h2>
      <div
        style={{
          height: "400px",
          overflowY: "auto",
          border: "1px solid #B3D7FF", // Light blue border
          borderRadius: "10px",
          padding: "1rem",
          backgroundColor: "#E8F4FF", // Light blue background
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
            <div
              style={{
                display: "inline-block",
                padding: "0.8rem 1.2rem",
                borderRadius: "20px",
                backgroundColor: msg.sender === "bot" ? "#A3C8FF" : "#3B74B5", // Bot and user message colors in blue scale
                color: "#333",
                whiteSpace: "pre-wrap",
                textAlign: "right",
                maxWidth: "80%",
                wordBreak: "break-word",
                marginBottom: "0.5rem",
                boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)", // Soft shadow for speech bubbles
                borderTopLeftRadius: msg.sender === "bot" ? "20px" : "0",
                borderTopRightRadius: msg.sender === "user" ? "20px" : "0",
                borderBottomLeftRadius: "20px",
                borderBottomRightRadius: "20px",
              }}
            >
              {msg.text}
            </div>
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
              border: "1px solid #B3D7FF", // Light blue border
              borderRadius: "5px",
              direction: "rtl",
              textAlign: "right",
              fontFamily: "'Assistant', 'Rubik', sans-serif", // Friendly font
            }}
          />
          <button
            onClick={handleSendToGemini}
            style={{
              marginTop: "0.5rem",
              padding: "0.5rem 1rem",
              backgroundColor: "#3B74B5", // Blue button
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
              backgroundColor: "#FF6B6B", // Red button
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
                padding: "1rem",
                marginBottom: "0.5rem",
                backgroundColor: "#A3C8FF", // Option button
                color: "#3B74B5", // Text color
                border: "1px solid #B3D7FF", // Border in light blue
                borderRadius: "5px",
                cursor: "pointer",
                fontFamily: "'Assistant', 'Rubik', sans-serif", // Friendly font
              }}
            >
              {option.text}
            </button>
          ))}
        </div>
      )}

      <button
        onClick={handleBack}
        style={{
          backgroundColor: "#FFD700", // Yellow "Back" button
          color: "white",
          padding: "0.7rem 1.2rem",
          border: "none",
          borderRadius: "10px",
          cursor: "pointer",
          marginTop: "1rem",
        }}
      >
        חזור
      </button>

      {isLoading && (
        <div style={{ textAlign: "center", marginTop: "1rem" }}>
          <span>טעינה...</span>
        </div>
      )}
    </div>
  );
};

export default Bot;