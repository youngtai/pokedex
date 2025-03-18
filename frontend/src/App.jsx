import { useState, useEffect, useRef } from "react";
import "./App.css";
import PokedexLeft from "./components/PokedexLeft";
import PokedexRight from "./components/PokedexRight";
import useSpeechSynthesis from "./hooks/useSpeechSynthesis";
import usePokemonCry from "./hooks/usePokemonCry";
import useSpeechRecognition from "./hooks/useSpeechRecognition";
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
  const isMounted = useRef(true);
  const formRef = useRef(null);

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

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();

    const userQuery = input.trim();
    if (!userQuery || loading) return;

    setInput("");
    stopListening();
    setLoading(true);
    stopSpeaking();

    try {
      const response = await processInput(userQuery);

      if (!isMounted.current) return;

      setDisplayText(response.text || "");

      setChatHistory((prev) => [
        ...prev,
        {
          role: "assistant",
          content: response.text || "",
          structuredData: response.structuredData,
        },
      ]);

      setTimeout(() => {
        if (
          response.structuredData &&
          response.structuredData.sections &&
          response.structuredData.sections.length > 0
        ) {
          speakText(response.structuredData.sections[0].content);
        } else if (response.text) {
          speakText(response.text);
        }
      }, 500);
    } catch (error) {
      console.error("Error processing request:", error);

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
      if (isMounted.current) {
        setLoading(false);
      }
    }
  };

  const {
    transcript,
    isListening,
    isProcessing,
    startListening,
    stopListening,
    resetTranscript,
    error: speechError,
  } = useSpeechRecognition({
    language: "en-US",
    onResult: (result, autoSubmit = true) => {
      if (result.trim() && !loading) {
        setInput(result.trim());

        if (autoSubmit) {
          setTimeout(() => {
            handleSubmit();
          }, 100);
        }
      }
    },
  });

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (displayRef.current) {
      displayRef.current.scrollTo(0, displayRef.current.scrollHeight);
    }
  }, [displayText, structuredData, activeSection]);

  useEffect(() => {
    const initialData = {
      sections: [
        {
          title: "Welcome to the Pokédex!",
          content:
            "I can help you with information about Pokémon. Ask me anything, such as:\n\n- Tell me about Pikachu\n- What are the strengths and weaknesses of Charizard?\n- Compare Bulbasaur and Squirtle\n- Show me some water type Pokemon\n- Which Pokemon has the highest speed stat?\n\nWhat would you like to know? Type below or click the microphone icon to speak.",
        },
      ],
    };
    setStructuredData(initialData);
    setDisplayText(
      "# Welcome to the Pokédex!\n\nI can help you with information about Pokémon. Ask me anything, such as:\n\n- Tell me about Pikachu\n- What are the strengths and weaknesses of Charizard?\n- Compare Bulbasaur and Squirtle\n- Show me some water type Pokemon\n- Which Pokemon has the highest speed stat?\n\nWhat would you like to know? Type below or click the microphone icon to speak."
    );
  }, []);

  const cycleSprite = () => {
    if (!currentPokemon) return;

    const spriteKeys = getAvailableSpriteKeys(currentPokemon);

    if (spriteKeys.length === 0) return;

    const nextIndex = (currentSpriteIndex + 1) % spriteKeys.length;
    setCurrentSpriteIndex(nextIndex);
  };

  const selectSectionText = () => {
    if (!contentRef.current) return;

    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(contentRef.current);
    selection.removeAllRanges();
    selection.addRange(range);
  };

  const speakCurrentSection = () => {
    if (
      structuredData?.sections &&
      structuredData.sections[activeSection]?.content
    ) {
      speakText(structuredData.sections[activeSection].content);
    }
  };

  const processInput = async (userInput) => {
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

      if (!isMounted.current) return { text: "", structuredData: null };

      if (responseJson.pokemon_data) {
        setCurrentPokemon(responseJson.pokemon_data);
        setCurrentSpriteIndex(0);
      } else {
        setCurrentPokemon(null);
      }

      if (responseJson.structured_data) {
        const newStructuredData = responseJson.structured_data;
        setStructuredData(newStructuredData);

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

  const handleSectionChange = (index) => {
    stopSpeaking();

    if (
      structuredData &&
      structuredData.sections &&
      index >= 0 &&
      index < structuredData.sections.length
    ) {
      setActiveSection(index);

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
        formRef={formRef}
        loading={loading || isProcessing}
        displayRef={displayRef}
        contentRef={contentRef}
        selectSectionText={selectSectionText}
        isSpeaking={isSpeaking}
        voiceOptions={voiceOptions}
        selectedVoice={selectedVoice}
        setSelectedVoice={setSelectedVoice}
        speakCurrentSection={speakCurrentSection}
        stopSpeaking={stopSpeaking}
        isListening={isListening}
        isProcessing={isProcessing}
        startListening={startListening}
        stopListening={stopListening}
        transcript={transcript}
        speechError={speechError}
      />
    </div>
  );
}

export default App;
