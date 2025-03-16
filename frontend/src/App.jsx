// frontend/src/App.jsx
import { useState, useEffect, useRef } from "react";
import "./App.css";
import ReactMarkdown from "react-markdown";

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const messagesEndRef = useRef(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Initial welcome message
  useEffect(() => {
    setMessages([
      {
        sender: "bot",
        text: "# Welcome to the Pokédex Chat!\n\nI can help you with information about Pokémon. Ask me anything about Pokémon, such as:\n\n- Tell me about Pikachu\n- What are the strengths and weaknesses of Charizard?\n- Compare Bulbasaur and Squirtle\n- Show me some water type Pokemon\n- Which Pokemon has the highest speed stat?\n\nWhat would you like to know?",
      },
    ]);
  }, []);

  const processInput = async (userInput) => {
    // Add user input to chat history
    const updatedHistory = [
      ...chatHistory,
      { role: "user", content: userInput },
    ];
    setChatHistory(updatedHistory);

    try {
      const response = await fetch("/service/pokemon/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query: userInput }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Unknown error occurred");
      }

      const responseJson = await response.json();
      console.log("Response from server:", responseJson);
      return responseJson.data;
    } catch (error) {
      console.error("Error processing chat query:", error);
      return "Sorry, I encountered an error while processing your question. Please try again.";
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    // Add user message
    const userMessage = { sender: "user", text: input };
    setMessages((prev) => [...prev, userMessage]);

    // Clear input and set loading
    setInput("");
    setLoading(true);

    try {
      // Process user input
      const response = await processInput(input);

      // Format bot message
      let botMessage = { sender: "bot", text: response };

      setMessages((prev) => [...prev, botMessage]);

      // Add bot response to chat history
      setChatHistory((prev) => [
        ...prev,
        {
          role: "assistant",
          content: response,
        },
      ]);
    } catch (error) {
      console.error("Error processing request:", error);
      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: "Sorry, I encountered an error while processing your request.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pokedex-container">
      <header className="pokedex-header">
        <h1>Pokédex Chat</h1>
      </header>

      <div className="messages-container">
        {messages.map((msg, index) => (
          <div key={index} className={`message ${msg.sender}`}>
            <div className="message-content">
              {msg.sender === "bot" ? (
                <div className="bot-message">
                  <ReactMarkdown>{msg.text}</ReactMarkdown>
                </div>
              ) : (
                <p>{msg.text}</p>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="message bot">
            <div className="message-content">
              <div className="loading-dots">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="input-form">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask anything about Pokémon..."
          disabled={loading}
        />
        <button type="submit" disabled={loading || !input.trim()}>
          Send
        </button>
      </form>
    </div>
  );
}

export default App;
