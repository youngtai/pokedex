import styled from "@emotion/styled";
import ReactMarkdown from "react-markdown";
import SectionTabs from "./SectionTabs";
import SpeechControls from "./SpeechControls";
import { theme } from "../theme";

// Styled components
const PokedexRightContainer = styled.div`
  flex: 1;
  background-color: ${theme.colors.pokedexRed};
  border-radius: 5px 15px 15px 5px;
  box-shadow: ${theme.shadows.heavy};
  overflow: hidden;
  position: relative;
  z-index: 1;

  @media (max-width: ${theme.breakpoints.tablet}) {
    border-radius: 5px 5px 15px 15px;
    margin-top: -5px;
  }
`;

const PokedexRightTop = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: ${theme.spacing.md};
  border-bottom: 3px solid ${theme.colors.pokedexDarkRed};
`;

const SmallLight = styled.div`
  width: 15px;
  height: 15px;
  border-radius: 50%;
  background-color: ${theme.colors.pokedexGreen};
  border: 2px solid rgba(0, 0, 0, 0.3);
  box-shadow: inset 0 0 8px rgba(255, 255, 255, 0.8);
  margin-right: ${theme.spacing.md};

  @media (max-width: ${theme.breakpoints.mobile}) {
    width: 15px;
    height: 15px;
  }
`;

const ScreenContainer = styled.div`
  padding: ${theme.spacing.lg};
  background-color: ${theme.colors.pokedexRed};
  display: flex;
  flex-direction: column;
  height: calc(100% - 93px);
`;

const Screen = styled.div`
  background-color: ${theme.colors.screenBg};
  border-radius: ${theme.borders.radius.md};
  border: 15px solid ${theme.colors.screenBorder};
  height: 320px;
  overflow: hidden;
  position: relative;
  box-shadow: ${theme.shadows.inset};
  flex-grow: 1;
  margin-bottom: ${theme.spacing.lg};

  @media (max-width: ${theme.breakpoints.mobile}) {
    height: 250px;
    border-width: 10px;
  }
`;

const ScreenContent = styled.div`
  padding: ${theme.spacing.md};
  font-family: ${theme.fonts.mono};
  font-size: 16px;
  line-height: 1.4;
  color: ${theme.colors.pokedexBlack};
  height: 100%;
  overflow-y: auto;
  scrollbar-width: thin;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: ${theme.colors.screenDark};
  }

  &::-webkit-scrollbar-thumb {
    background-color: ${theme.colors.pokedexBlack};
    border-radius: ${theme.borders.radius.md};
  }

  h1,
  h2 {
    color: ${theme.colors.pokedexBlack};
    margin-top: 10px;
    margin-bottom: 10px;
    font-family: ${theme.fonts.pixel};
    font-size: 16px;
  }

  h1 {
    font-size: 18px;
  }

  ul {
    padding-left: 20px;
  }

  p {
    margin-bottom: 10px;
  }

  img {
    max-width: 100px;
    height: auto;
    display: block;
    margin: 10px auto;
    image-rendering: pixelated;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    margin: 10px 0;
    font-size: 14px;
  }

  th,
  td {
    border: 1px solid ${theme.colors.pokedexBlack};
    padding: 5px;
    text-align: left;
  }

  th {
    background-color: ${theme.colors.screenDark};
  }
`;

const StructuredContent = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow-y: auto;

  h2 {
    margin-top: 0;
    color: #cc0000;
    border-bottom: 2px solid #cc0000;
    padding-bottom: 5px;
    margin-bottom: 10px;
  }
`;

const InputArea = styled.form`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.md};
`;

const InputWithStatus = styled.div`
  position: relative;
  width: 100%;
`;

const Input = styled.input`
  width: 100%;
  padding: 10px;
  border: 3px solid ${theme.colors.pokedexBlack};
  border-radius: ${theme.borders.radius.sm};
  font-family: ${theme.fonts.mono};
  font-size: 18px;
  background-color: #e0e0e0;
  color: ${theme.colors.pokedexBlack};

  &:disabled {
    background-color: #f5f5f5;
    font-style: italic;
  }
`;

const SearchButton = styled.button`
  padding: 10px;
  background-color: ${theme.colors.pokedexBlack};
  color: white;
  border: none;
  border-radius: ${theme.borders.radius.sm};
  cursor: pointer;
  font-family: ${theme.fonts.pixel};
  font-size: 14px;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    background-color: #333;
    transform: translateY(-2px);
  }

  &:active:not(:disabled) {
    transform: translateY(1px);
  }

  &:disabled {
    background-color: #777;
    cursor: not-allowed;
  }

  @media (max-width: ${theme.breakpoints.mobile}) {
    font-size: 12px;
  }
`;

const ListeningIndicator = styled.div`
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  width: 10px;
  height: 10px;
  background-color: ${theme.colors.recordingRed};
  border-radius: 50%;
  animation: pulse 1.5s infinite;

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
`;

const ProcessingIndicator = styled.div`
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  width: 12px;
  height: 12px;
  background-color: orange;
  border-radius: 50%;
  animation: pulse 1.5s infinite ease-in-out;
`;

const SpeechErrorIndicator = styled.div`
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  color: orange;
  font-size: 18px;
`;

export default function PokedexRight({
  structuredData,
  activeSection,
  handleSectionChange,
  displayText,
  input,
  setInput,
  handleSubmit,
  formRef,
  loading,
  displayRef,
  contentRef,
  isSpeaking,
  speakCurrentSection,
  stopSpeaking,
  isListening,
  isProcessing,
  startListening,
  stopListening,
  transcript,
  speechError,
}) {
  const renderStructuredContent = () => {
    if (
      !structuredData ||
      !structuredData.sections ||
      !structuredData.sections.length
    ) {
      return <ReactMarkdown>{displayText || ""}</ReactMarkdown>;
    }

    const validIndex = Math.min(
      activeSection,
      structuredData.sections.length - 1
    );
    const section = structuredData.sections[validIndex];

    if (!section) {
      return <ReactMarkdown>{displayText || ""}</ReactMarkdown>;
    }

    return (
      <StructuredContent>
        <h2>{section.title}</h2>
        <div ref={contentRef}>
          <ReactMarkdown>{section.content || ""}</ReactMarkdown>
        </div>
      </StructuredContent>
    );
  };

  return (
    <PokedexRightContainer>
      <PokedexRightTop>
        <SmallLight className="green" />

        <SpeechControls
          isSpeaking={isSpeaking}
          onSpeak={speakCurrentSection}
          onStop={stopSpeaking}
          isListening={isListening}
          isProcessing={isProcessing}
          onStartListening={startListening}
          onStopListening={stopListening}
        />
      </PokedexRightTop>

      <ScreenContainer>
        <SectionTabs
          sections={structuredData?.sections}
          activeSection={activeSection}
          handleSectionChange={handleSectionChange}
        />

        <Screen>
          <ScreenContent ref={displayRef}>
            {renderStructuredContent()}
          </ScreenContent>
        </Screen>

        <InputArea ref={formRef} onSubmit={handleSubmit}>
          <InputWithStatus>
            <Input
              type="text"
              value={
                isListening
                  ? transcript || "Listening..."
                  : isProcessing
                  ? "Processing speech..."
                  : input
              }
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                speechError === "microphone_access_error"
                  ? "Microphone access denied - type your query"
                  : "Ask Pokédex... or press and hold 🎤 to speak"
              }
              disabled={loading || isListening || isProcessing}
            />
            {isListening && <ListeningIndicator />}
            {isProcessing && <ProcessingIndicator />}
            {speechError && !isListening && !isProcessing && (
              <SpeechErrorIndicator title={`Error: ${speechError}`}>
                ⚠️
              </SpeechErrorIndicator>
            )}
          </InputWithStatus>
          <SearchButton
            type="submit"
            disabled={
              loading || isProcessing || (!input.trim() && !transcript.trim())
            }
          >
            SEARCH
          </SearchButton>
        </InputArea>
      </ScreenContainer>
    </PokedexRightContainer>
  );
}
