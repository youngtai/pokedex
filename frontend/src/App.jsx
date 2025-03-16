// frontend/src/App.jsx
import { useState, useEffect, useRef } from "react";
import "./App.css";
import ReactMarkdown from "react-markdown";

function App() {
  const [displayText, setDisplayText] = useState("");
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const displayRef = useRef(null);

  // Scroll to bottom when display changes
  useEffect(() => {
    displayRef.current?.scrollTo(0, displayRef.current.scrollHeight);
  }, [displayText]);

  // Initial welcome message
  useEffect(() => {
    setDisplayText(
      "# Welcome to the Pokédex!\n\nI can help you with information about Pokémon. Ask me anything, such as:\n\n- Tell me about Pikachu\n- What are the strengths and weaknesses of Charizard?\n- Compare Bulbasaur and Squirtle\n- Show me some water type Pokemon\n- Which Pokemon has the highest speed stat?\n\nWhat would you like to know?"
    );
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
      return "Error: Unable to retrieve Pokémon data. Check Pokédex connection and try again.";
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    // Clear input and set loading
    const userQuery = input;
    setInput("");
    setLoading(true);

    try {
      // Process user input
      const response = await processInput(userQuery);

      // Update the display with the new information
      setDisplayText(response);

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
      setDisplayText("Error: Pokédex data retrieval failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pokedex-device">
      <div className="pokedex-top">
        <div className="blue-light"></div>
        <div className="small-light red"></div>
        <div className="small-light yellow"></div>
        <div className="small-light green"></div>
      </div>

      <div className="pokedex-screen-container">
        <div className="pokedex-screen">
          {loading ? (
            <div className="loading-animation">
              <div className="pokeball-loading"></div>
              <p>Searching Pokédex database...</p>
            </div>
          ) : (
            <div className="screen-content" ref={displayRef}>
              <ReactMarkdown>{displayText}</ReactMarkdown>
            </div>
          )}
        </div>
      </div>

      <div className="pokedex-divider">
        <div className="hinge"></div>
        <div className="hinge"></div>
      </div>

      <div className="pokedex-bottom">
        <div className="d-pad">
          <div className="d-pad-row">
            <div className="d-pad-btn up"></div>
          </div>
          <div className="d-pad-row">
            <div className="d-pad-btn left"></div>
            <div className="d-pad-btn center"></div>
            <div className="d-pad-btn right"></div>
          </div>
          <div className="d-pad-row">
            <div className="d-pad-btn down"></div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="input-area">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask Pokédex..."
            disabled={loading}
            className="pokedex-input"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="pokedex-button"
          >
            SEARCH
          </button>
        </form>
      </div>
    </div>
  );
}

export default App;
