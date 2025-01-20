import React, { useState, useRef, useEffect } from "react";
import { flowData } from "./flowData";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import styles from "./page.module.css";

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
  const navigate = useNavigate();

  const currentQuestion = flowData.find(
    (question) => question.id === currentId
  );

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      const chatContainer = messagesEndRef.current.parentElement;
      if (chatContainer) {
        chatContainer.scrollTop = chatContainer.scrollHeight;
      }
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const delayMessage = (message: string) => {
    setTimeout(() => {
      setMessages((prev) => {
        if (prev.find((msg) => msg.text === message && msg.sender === "bot")) {
          return prev;
        }

        const updatedMessages = [...prev, { sender: "bot", text: message }];

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
      const res = await axios.post(
        `${import.meta.env.VITE_SERVER_API_URL}/api/gemini-response`,
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
    <div className={styles.botContainer}>
      <h2 className={styles.botHeader}>בוט תמיכה</h2>

      <div className={styles.chatContainer}>
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`${styles.message} ${
              msg.sender === "bot" ? styles.botMessage : styles.userMessage
            }`}
          >
            {msg.sender === "bot" && isOther ? (
              <div
                dangerouslySetInnerHTML={{ __html: msg.text }}
                className={styles.messageBubble}
              />
            ) : (
              <div className={styles.messageBubble}>{msg.text}</div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {isOther && (
        <div className={styles.inputContainer}>
          <textarea
            value={customQuestion}
            onChange={(e) => setCustomQuestion(e.target.value)}
            placeholder="כתוב כאן את השאלה שלך"
            className={styles.chatTextarea}
          />
          <button
            onClick={handleSendToGemini}
            className={`${styles.button} ${styles.sendButton}`}
          >
            שליחה
          </button>
          <button
            onClick={() => setIsOther(false)}
            className={`${styles.button} ${styles.exitButton}`}
          >
            סיימתי
          </button>
        </div>
      )}

      {!isOther && currentQuestion && (
        <div className={styles.optionsContainer}>
          {currentQuestion.options.map((option) => (
            <button
              key={option.id}
              onClick={() => handleOptionClick(option)}
              className={styles.optionButton}
            >
              {option.text}
            </button>
          ))}
        </div>
      )}

      {history.length > 0 && !isOther && (
        <button
          onClick={handleBack}
          className={`${styles.button} ${styles.backNavButton}`}
        >
          חזור לשאלה הקודמת
        </button>
      )}

      {isLoading && <div className={styles.loading}>טוען...</div>}
    </div>
  );
};

export default Bot;
