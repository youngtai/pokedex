import { css, Global, ThemeProvider } from "@emotion/react";
import { useEffect, useRef, useState } from "react";
import PokedexLeft from "./components/PokedexLeft";
import PokedexRight from "./components/PokedexRight";
import useSpeechRecognition from "./hooks/useSpeechRecognition";
import useSpeechSynthesis from "./hooks/useSpeechSynthesis";
import { theme } from "./theme";
import { getAvailableSpriteKeys } from "./utils/spriteUtils";

const pokedexContainerStyle = css`
  display: flex;
  width: 100%;
  max-width: 1000px;
  margin: 0 auto;
  position: relative;
  gap: 10px;

  &::after {
    content: "";
    position: absolute;
    top: 25%;
    bottom: 25%;
    left: 50%;
    width: 15px;
    background-color: ${theme.colors.pokedexDarkRed};
    transform: translateX(-50%);
    border-left: 2px solid rgba(0, 0, 0, 0.2);
    border-right: 2px solid rgba(0, 0, 0, 0.2);
    z-index: 0;
  }

  @media (max-width: ${theme.breakpoints.tablet}) {
    flex-direction: column;

    &::after {
      display: none;
    }
  }
`;

const globalStyles = css`
  @import url("https://fonts.googleapis.com/css2?family=Press+Start+2P&family=VT323&display=swap");

  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  body {
    margin: 0;
    font-family: "Roboto", sans-serif;
    background-color: #1f1f1f;
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    padding: 20px;
  }

  @keyframes pulse {
    0% {
      opacity: 0.5;
      transform: scale(0.8) translateY(-50%);
    }
    50% {
      opacity: 1;
      transform: scale(1.2) translateY(-40%);
    }
    100% {
      opacity: 0.5;
      transform: scale(0.8) translateY(-50%);
    }
  }

  .push-to-talk {
    background-color: rgba(255, 255, 255, 0.3);
    transition: all 0.2s ease;
    user-select: none;
    touch-action: manipulation;
  }

  .push-to-talk:active,
  .push-to-talk.listening {
    background-color: rgba(255, 0, 0, 0.5);
    transform: scale(1.1);
    box-shadow: 0 0 8px rgba(255, 0, 0, 0.7);
  }

  .push-to-talk.listening {
    animation: pulse 1.5s infinite;
  }

  @keyframes pulse {
    0% {
      transform: scale(1.1);
      box-shadow: 0 0 0 0 rgba(255, 0, 0, 0.7);
    }
    70% {
      transform: scale(1.15);
      box-shadow: 0 0 0 10px rgba(255, 0, 0, 0);
    }
    100% {
      transform: scale(1.1);
      box-shadow: 0 0 0 0 rgba(255, 0, 0, 0);
    }
  }

  .type-tag {
    display: inline-block;
    padding: 3px 8px;
    margin: 2px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: bold;
    text-transform: uppercase;
    color: white;
  }

  .type-normal {
    background-color: ${theme.typeColors.normal};
  }
  .type-fire {
    background-color: ${theme.typeColors.fire};
  }
  .type-water {
    background-color: ${theme.typeColors.water};
  }
  .type-grass {
    background-color: ${theme.typeColors.grass};
  }
  .type-electric {
    background-color: ${theme.typeColors.electric};
  }
  .type-ice {
    background-color: ${theme.typeColors.ice};
  }
  .type-fighting {
    background-color: ${theme.typeColors.fighting};
  }
  .type-poison {
    background-color: ${theme.typeColors.poison};
  }
  .type-ground {
    background-color: ${theme.typeColors.ground};
  }
  .type-flying {
    background-color: ${theme.typeColors.flying};
  }
  .type-psychic {
    background-color: ${theme.typeColors.psychic};
  }
  .type-bug {
    background-color: ${theme.typeColors.bug};
  }
  .type-rock {
    background-color: ${theme.typeColors.rock};
  }
  .type-ghost {
    background-color: ${theme.typeColors.ghost};
  }
  .type-dark {
    background-color: ${theme.typeColors.dark};
  }
  .type-dragon {
    background-color: ${theme.typeColors.dragon};
  }
  .type-steel {
    background-color: ${theme.typeColors.steel};
  }
  .type-fairy {
    background-color: ${theme.typeColors.fairy};
  }
`;
function App() {
  const [displayText, setDisplayText] = useState("");

  const [loading, setLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [currentPokemon, setCurrentPokemon] = useState(null);
  const [currentSpriteIndex, setCurrentSpriteIndex] = useState(0);
  const [structuredData, setStructuredData] = useState(null);
  const [activeSection, setActiveSection] = useState(0);

  const displayRef = useRef(null);
  const contentRef = useRef(null);
  const isMounted = useRef(true);

  const { isSpeaking, speakText, stopSpeaking } = useSpeechSynthesis();

  const handleProcessQuery = async (userQuery) => {
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
    error: speechError,
  } = useSpeechRecognition({
    onResult: (result) => {
      if (result.trim() && !loading) {
        handleProcessQuery(result.trim());
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

  const cycleSprite = (direction) => {
    if (!currentPokemon) return;

    const spriteKeys = getAvailableSpriteKeys(currentPokemon);

    if (spriteKeys.length === 0) return;

    const indexChange = direction === "left" ? -1 : 1;
    let nextIndex = (currentSpriteIndex + indexChange) % spriteKeys.length;
    if (nextIndex < 0) nextIndex += spriteKeys.length;

    setCurrentSpriteIndex(nextIndex);
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
    <ThemeProvider theme={theme}>
      <Global styles={globalStyles} />
      <div css={pokedexContainerStyle}>
        <PokedexLeft
          loading={loading}
          currentPokemon={currentPokemon}
          currentSpriteIndex={currentSpriteIndex}
          isListening={isListening}
          isSpeaking={isSpeaking}
          isProcessing={isProcessing}
          startListening={startListening}
          stopListening={stopListening}
          cycleSprite={cycleSprite}
        />

        <PokedexRight
          structuredData={structuredData}
          activeSection={activeSection}
          handleSectionChange={handleSectionChange}
          displayText={displayText}
          loading={loading || isProcessing}
          displayRef={displayRef}
          contentRef={contentRef}
          isProcessing={isProcessing}
          transcript={transcript}
          speechError={speechError}
          isSpeaking={isSpeaking}
          onSpeak={speakCurrentSection}
          onStop={stopSpeaking}
          stopListening={stopListening}
          setLoading={setLoading}
          stopSpeaking={stopSpeaking}
          handleProcessQuery={handleProcessQuery}
        />
      </div>
    </ThemeProvider>
  );
}

export default App;
