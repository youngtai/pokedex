import { useState, useEffect, useRef } from "react";
import "./App.css";
import PokedexLeft from "./components/PokedexLeft";
import PokedexRight from "./components/PokedexRight";
import useSpeechSynthesis from "./hooks/useSpeechSynthesis";
import usePokemonCry from "./hooks/usePokemonCry";
import { getAvailableSpriteKeys } from "./utils/spriteUtils";

function App() {
  const [displayText, setDisplayText] = useState("");
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [currentPokemon, setCurrentPokemon] = useState(null);
  const [currentSpriteIndex, setCurrentSpriteIndex] = useState(0);
  const [structuredData, setStructuredData] = useState(null);
  const [activeSection, setActiveSection] = useState(0);

  const displayRef = useRef(null);
  const contentRef = useRef(null);
  // Keep track of mounted state to prevent state updates after unmounting
  const isMounted = useRef(true);

  // Custom hooks
  const {
    isSpeaking,
    voiceOptions,
    selectedVoice,
    setSelectedVoice,
    speakText,
    stopSpeaking,
  } = useSpeechSynthesis();

  const { crySoundLoaded, playCry } = usePokemonCry(
    currentPokemon?.cry_url,
    currentPokemon?.cry_url_backup
  );

  // Set isMounted to false when component unmounts
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Scroll to bottom when display changes
  useEffect(() => {
    if (displayRef.current) {
      displayRef.current.scrollTo(0, displayRef.current.scrollHeight);
    }
  }, [displayText, structuredData, activeSection]);

  // Initial welcome message
  useEffect(() => {
    const initialData = {
      sections: [
        {
          title: "Welcome to the Pokédex!",
          content:
            "I can help you with information about Pokémon. Ask me anything, such as:\n\n- Tell me about Pikachu\n- What are the strengths and weaknesses of Charizard?\n- Compare Bulbasaur and Squirtle\n- Show me some water type Pokemon\n- Which Pokemon has the highest speed stat?\n\nWhat would you like to know?",
        },
      ],
    };
    setStructuredData(initialData);
    setDisplayText(
      "# Welcome to the Pokédex!\n\nI can help you with information about Pokémon. Ask me anything, such as:\n\n- Tell me about Pikachu\n- What are the strengths and weaknesses of Charizard?\n- Compare Bulbasaur and Squirtle\n- Show me some water type Pokemon\n- Which Pokemon has the highest speed stat?\n\nWhat would you like to know?"
    );
  }, []);

  const cycleSprite = () => {
    if (!currentPokemon) return;

    // Get all available sprites
    const spriteKeys = getAvailableSpriteKeys(currentPokemon);

    if (spriteKeys.length === 0) return;

    // Cycle to the next sprite
    const nextIndex = (currentSpriteIndex + 1) % spriteKeys.length;
    setCurrentSpriteIndex(nextIndex);
  };

  // Function to help users select all text in the active section
  const selectSectionText = () => {
    if (!contentRef.current) return;

    // Select the text in the current section
    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(contentRef.current);
    selection.removeAllRanges();
    selection.addRange(range);
  };

  // Function to speak the current active section
  const speakCurrentSection = () => {
    if (
      structuredData?.sections &&
      structuredData.sections[activeSection]?.content
    ) {
      speakText(structuredData.sections[activeSection].content);
    }
  };

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

      // Check if component is still mounted before updating state
      if (!isMounted.current) return { text: "", structuredData: null };

      // Process Pokemon data if it exists
      if (responseJson.pokemon_data) {
        setCurrentPokemon(responseJson.pokemon_data);
        // Reset sprite index when loading a new Pokemon
        setCurrentSpriteIndex(0);
      } else {
        setCurrentPokemon(null);
      }

      // Set structured data if available
      if (responseJson.structured_data) {
        // Ensure activeSection is within bounds
        const newStructuredData = responseJson.structured_data;
        setStructuredData(newStructuredData);

        // Reset to first section
        if (
          newStructuredData.sections &&
          newStructuredData.sections.length > 0
        ) {
          setActiveSection(0);
        }
      }

      return {
        text: responseJson.text || "",
        structuredData: responseJson.structured_data,
      };
    } catch (error) {
      console.error("Error processing chat query:", error);

      // Check if component is still mounted before updating state
      if (!isMounted.current) return { text: "", structuredData: null };

      setCurrentPokemon(null);
      const errorData = {
        sections: [
          {
            title: "Error",
            content:
              "Error: Unable to retrieve Pokémon data. Check Pokédex connection and try again.",
          },
        ],
      };
      setStructuredData(errorData);
      setActiveSection(0);

      return {
        text: "Error: Unable to retrieve Pokémon data. Check Pokédex connection and try again.",
        structuredData: errorData,
      };
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    // Clear input and set loading
    const userQuery = input;
    setInput("");
    setLoading(true);

    // Stop any ongoing speech
    stopSpeaking();

    try {
      // Process user input
      const response = await processInput(userQuery);

      // Check if component is still mounted
      if (!isMounted.current) return;

      // Update the display with the new information
      setDisplayText(response.text || "");

      // Add bot response to chat history
      setChatHistory((prev) => [
        ...prev,
        {
          role: "assistant",
          content: response.text || "",
          structuredData: response.structuredData,
        },
      ]);

      // Read the summary section aloud after a short delay to ensure the UI has updated
      setTimeout(() => {
        if (
          response.structuredData &&
          response.structuredData.sections &&
          response.structuredData.sections.length > 0
        ) {
          // Read the first section (summary) aloud
          speakText(response.structuredData.sections[0].content);
        } else if (response.text) {
          // If no structured data, read the response text
          speakText(response.text);
        }
      }, 500);
    } catch (error) {
      console.error("Error processing request:", error);

      // Check if component is still mounted
      if (!isMounted.current) return;

      setDisplayText("Error: Pokédex data retrieval failed. Please try again.");
      const errorData = {
        sections: [
          {
            title: "Error",
            content: "Error: Pokédex data retrieval failed. Please try again.",
          },
        ],
      };
      setStructuredData(errorData);
      setActiveSection(0);
    } finally {
      // Check if component is still mounted
      if (isMounted.current) {
        setLoading(false);
      }
    }
  };

  const handleSectionChange = (index) => {
    // Stop speaking when changing sections
    stopSpeaking();

    // Make sure index is valid
    if (
      structuredData &&
      structuredData.sections &&
      index >= 0 &&
      index < structuredData.sections.length
    ) {
      setActiveSection(index);

      // Read the new section aloud
      if (structuredData.sections[index]) {
        speakText(structuredData.sections[index].content);
      }
    }
  };

  return (
    <div className="pokedex-container">
      <PokedexLeft
        loading={loading}
        currentPokemon={currentPokemon}
        currentSpriteIndex={currentSpriteIndex}
        crySoundLoaded={crySoundLoaded}
        playCry={playCry}
        cycleSprite={cycleSprite}
      />

      <PokedexRight
        structuredData={structuredData}
        activeSection={activeSection}
        handleSectionChange={handleSectionChange}
        displayText={displayText}
        input={input}
        setInput={setInput}
        handleSubmit={handleSubmit}
        loading={loading}
        displayRef={displayRef}
        contentRef={contentRef}
        selectSectionText={selectSectionText}
        isSpeaking={isSpeaking}
        voiceOptions={voiceOptions}
        selectedVoice={selectedVoice}
        setSelectedVoice={setSelectedVoice}
        speakCurrentSection={speakCurrentSection}
        stopSpeaking={stopSpeaking}
      />
    </div>
  );
}

export default App;
