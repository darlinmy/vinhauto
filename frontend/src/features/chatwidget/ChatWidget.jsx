import React, { useState, useEffect, useRef } from "react";
import "./ChatWidget.css";

function ChatWidget({ apiUrl = window.location.origin }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: "welcome",
      sender: "bot",
      text: "Xin chào! Tôi là trợ lý chẩn đoán của Vinh. Bạn cần hỗ trợ gì về kỹ thuật xe hôm nay?",
      sources: [],
      isStreaming: false,
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  // Quick action suggestions
  const suggestions = [
    "Lịch bảo dưỡng Ford Ranger?",
    "Ý nghĩa của mã lỗi động cơ?",
    "Thông tin về Technical Service Bulletins?",
    "Dung tích nhớt động cơ Ford Ranger?",
  ];

  // Auto-scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSendMessage = async (textToSend) => {
    const query = textToSend || input;
    if (!query.trim()) return;

    if (!textToSend) setInput(""); // Clear input field if sent from input

    // 1. Add user message to screen
    const userMessageId = Date.now().toString();
    const userMessage = {
      id: userMessageId,
      sender: "user",
      text: query,
      sources: [],
      isStreaming: false,
    };

    // 2. Setup initial bot message placeholder (with isStreaming: true)
    const botMessageId = (Date.now() + 1).toString();
    const botMessagePlaceholder = {
      id: botMessageId,
      sender: "bot",
      text: "",
      sources: [],
      isStreaming: true,
    };

    // Capture history before adding current query and placeholder (limit to last 10 messages)
    const historyPayload = messages
      .filter(msg => !msg.isStreaming)
      .slice(-10)
      .map(msg => ({
        sender: msg.sender,
        text: msg.text
      }));

    setMessages((prev) => [...prev, userMessage, botMessagePlaceholder]);
    setIsTyping(true);

    try {
      // 3. Call backend FastAPI stream endpoint
      const response = await fetch(`${apiUrl}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          message: query,
          history: historyPayload
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned status: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let buffer = "";

      // Stream reading loop
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        // Decode binary stream chunk to text and append to buffer
        buffer += decoder.decode(value, { stream: true });
        
        // Split by double newline (SSE standard separator)
        const lines = buffer.split("\n");
        // Save the last potentially incomplete line back to buffer
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmedLine = line.trim();
          if (!trimmedLine || !trimmedLine.startsWith("data: ")) continue;

          // Extract and parse the JSON payload
          const jsonStr = trimmedLine.substring(6);
          try {
            const payload = JSON.parse(jsonStr);

            if (payload.type === "sources") {
              // Update bot message sources
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === botMessageId
                    ? { ...msg, sources: payload.data }
                    : msg
                )
              );
            } else if (payload.type === "token") {
              // Append token to text
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === botMessageId
                    ? { ...msg, text: msg.text + payload.data }
                    : msg
                )
              );
            } else if (payload.type === "error") {
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === botMessageId
                    ? { ...msg, text: `Có lỗi xảy ra: ${payload.data}` }
                    : msg
                )
              );
            }
          } catch (e) {
            console.error("Failed to parse stream event payload:", e);
          }
        }
      }
    } catch (error) {
      console.error("Streaming error:", error);
      // Update bot message to show error
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === botMessageId
            ? {
                ...msg,
                text: "Xin lỗi, hệ thống không thể kết nối tới máy chủ. Vui lòng thử lại sau hoặc liên hệ kỹ thuật viên.",
              }
            : msg
        )
      );
    } finally {
      // 5. Mark streaming as done
      setIsTyping(false);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === botMessageId ? { ...msg, isStreaming: false } : msg
        )
      );
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="autodiag-widget-container">
      {/* 1. Chat Window */}
      {isOpen && (
        <div className="autodiag-chat-window">
          {/* Header */}
          <div className="autodiag-chat-header">
            <div className="autodiag-header-info">
              <div className="autodiag-avatar-container">
                <span className="autodiag-status-dot"></span>
              </div>
              <div>
                <h3 className="autodiag-title">Vinh Auto Xin Chào </h3>
                <p className="autodiag-subtitle">Chẩn đoán sự cố tự động</p>
              </div>
            </div>
            <button
              className="autodiag-close-btn"
              onClick={() => setIsOpen(false)}
              aria-label="Close Chat"
            >
              &times;
            </button>
          </div>

          {/* Messages Area */}
          <div className="autodiag-messages-container">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`autodiag-message-wrapper ${
                  msg.sender === "user" ? "user-wrapper" : "bot-wrapper"
                }`}
              >
                {msg.sender === "bot" && (
                  <div className="autodiag-msg-avatar"></div>
                )}
                <div className="autodiag-message-bubble-group">
                  <div className={`autodiag-message-bubble ${msg.sender}`}>
                    {msg.text ? (
                      <p className="autodiag-message-text">{msg.text}</p>
                    ) : (
                      msg.isStreaming && (
                        <div className="autodiag-typing-dots">
                          <span></span>
                          <span></span>
                          <span></span>
                        </div>
                      )
                    )}
                  </div>
                  

                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggestions list when message history is short or input empty */}
          {messages.length === 1 && (
            <div className="autodiag-suggestions-container">
              <p className="autodiag-suggestions-title">Gợi ý câu hỏi:</p>
              <div className="autodiag-suggestions-list">
                {suggestions.map((s, idx) => (
                  <button
                    key={idx}
                    className="autodiag-suggestion-btn"
                    onClick={() => handleSendMessage(s)}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input Area */}
          <div className="autodiag-input-container">
            <textarea
              className="autodiag-input-field"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Nhập câu hỏi hoặc mã lỗi xe tại đây..."
              rows={1}
              disabled={isTyping}
            />
            <button
              className="autodiag-send-btn"
              onClick={() => handleSendMessage()}
              disabled={!input.trim() || isTyping}
              aria-label="Send Message"
            >
              <svg viewBox="0 0 24 24" width="20" height="20">
                <path
                  fill="currentColor"
                  d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"
                />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* 2. Floating Toggle Button */}
      <button
        className={`autodiag-toggle-btn ${isOpen ? "active" : ""}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle Chatbot"
      >
        {isOpen ? (
          <span className="autodiag-toggle-icon close">&times;</span>
        ) : (
          <span className="autodiag-toggle-icon chat">💬</span>
        )}
        {!isOpen && (
          <span className="autodiag-pulse-ring"></span>
        )}
      </button>
    </div>
  );
}

export default ChatWidget;
