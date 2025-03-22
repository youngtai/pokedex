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

  const [isCameraActive, setIsCameraActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [isAnalyzingImage, setIsAnalyzingImage] = useState(false);

  const displayRef = useRef(null);
  const contentRef = useRef(null);
  const isMounted = useRef(true);

  const { isSpeaking, isPaused, speakText, stopSpeaking, toggleSpeaking } =
    useSpeechSynthesis();

  const handleProcessQuery = async (userQuery) => {
    try {
      stopListening();
      setLoading(true);
      stopSpeaking();
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
            "I'm here to help Pokémon trainers like you! Ask me anything about Pokémon.",
        },
      ],
    };
    setStructuredData(initialData);
    setDisplayText(
      "# Welcome to the Pokédex!\n\nI'm here to help Pokémon trainers like you! Ask me anything about Pokémon."
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

  const handleImageCapture = async (file) => {
    if (!file) {
      setIsCameraActive(false);
      return;
    }

    setIsCameraActive(false);
    setCapturedImage(file);
    setIsAnalyzingImage(true);

    try {
      // Create a FormData instance
      const formData = new FormData();
      formData.append("data", file);

      // Send the image to the backend for analysis
      const response = await fetch("/service/analyze-image", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to analyze image");
      }

      const result = await response.json();
      console.log("Image analysis result:", result);

      if (
        result.identification &&
        result.identification.pokemon_identified &&
        result.pokemon_data
      ) {
        // If a Pokémon was identified and we have data, update the state
        setCurrentPokemon(result.pokemon_data);
        setCurrentSpriteIndex(0);

        // Set the structured data if it exists
        if (result.structured_data) {
          setStructuredData(result.structured_data);
          setActiveSection(0);
        }

        // Use the raw markdown if it exists
        if (result.raw_markdown) {
          setDisplayText(result.raw_markdown);
        }

        // Add to chat history
        setChatHistory((prev) => [
          ...prev,
          { role: "user", content: "📷 [Shared an image]" },
          {
            role: "assistant",
            content:
              result.raw_markdown ||
              `I've identified **${result.pokemon_data.name}** in your image!`,
            structuredData: result.structured_data,
          },
        ]);

        // Read out the response
        setTimeout(() => {
          if (result.structured_data?.sections?.[0]?.content) {
            speakText(result.structured_data.sections[0].content);
          } else {
            speakText(
              `I've identified ${result.pokemon_data.name} in your image!`
            );
          }
        }, 500);
      } else {
        // No Pokémon was identified
        setCurrentPokemon(null);

        // Use the structured data from the response if available
        if (result.structured_data) {
          setStructuredData(result.structured_data);
          setActiveSection(0);
        } else {
          const defaultStructuredData = {
            sections: [
              {
                title: "No Pokémon Identified",
                content:
                  "I couldn't identify any Pokémon in this image. Please try again with a clearer image of a Pokémon.",
              },
            ],
          };
          setStructuredData(defaultStructuredData);
        }

        // Use raw markdown if available
        if (result.raw_markdown) {
          setDisplayText(result.raw_markdown);
        } else {
          setDisplayText(
            "# No Pokémon Identified\n\nI couldn't identify any Pokémon in this image. Please try again with a clearer image of a Pokémon."
          );
        }

        // Add to chat history
        setChatHistory((prev) => [
          ...prev,
          { role: "user", content: "📷 [Shared an image]" },
          {
            role: "assistant",
            content:
              result.raw_markdown ||
              "I couldn't identify any Pokémon in this image.",
            structuredData: result.structured_data,
          },
        ]);

        // Read out the response
        setTimeout(() => {
          if (result.structured_data?.sections?.[0]?.content) {
            speakText(result.structured_data.sections[0].content);
          } else {
            speakText(
              "I couldn't identify any Pokémon in this image. Please try again with a clearer image of a Pokémon."
            );
          }
        }, 500);
      }
    } catch (error) {
      console.error("Error analyzing image:", error);

      const errorData = {
        sections: [
          {
            title: "Error",
            content:
              "Sorry, I encountered an error while analyzing the image. Please try again.",
          },
        ],
      };

      setStructuredData(errorData);
      setActiveSection(0);
      setDisplayText(
        "# Error\n\nSorry, I encountered an error while analyzing the image. Please try again."
      );

      // Add to chat history
      setChatHistory((prev) => [
        ...prev,
        { role: "user", content: "📷 [Shared an image]" },
        {
          role: "assistant",
          content: "Sorry, I encountered an error while analyzing the image.",
          structuredData: errorData,
        },
      ]);

      setTimeout(() => {
        speakText(
          "Sorry, I encountered an error while analyzing the image. Please try again."
        );
      }, 500);
    } finally {
      setIsAnalyzingImage(false);
      // Clear the captured image after a delay so user can see what was captured
      setTimeout(() => {
        setCapturedImage(null);
      }, 3000);
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
          isCameraActive={isCameraActive}
          setIsCameraActive={setIsCameraActive}
          onImageCapture={handleImageCapture}
          capturedImage={capturedImage}
          isAnalyzingImage={isAnalyzingImage}
        />

        <PokedexRight
          structuredData={structuredData}
          activeSection={activeSection}
          handleSectionChange={handleSectionChange}
          displayText={displayText}
          loading={loading || isProcessing || isAnalyzingImage}
          displayRef={displayRef}
          contentRef={contentRef}
          isProcessing={isProcessing}
          transcript={transcript}
          speechError={speechError}
          isSpeaking={isSpeaking}
          onSpeak={speakCurrentSection}
          onStop={stopSpeaking}
          handleProcessQuery={handleProcessQuery}
          isPaused={isPaused}
          onResume={toggleSpeaking}
        />
      </div>
    </ThemeProvider>
  );
}

export default App;
