import { css, keyframes } from "@emotion/react";
import { useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { theme } from "../theme";
import SectionTabs from "./SectionTabs";

const pokedexRightContainerStyle = css`
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

const screenContainerStyle = css`
  padding: ${theme.spacing.lg};
  background-color: ${theme.colors.pokedexRed};
  display: flex;
  flex-direction: column;
  height: calc(100% - 93px);
`;

const screenStyle = css`
  background-color: ${theme.colors.screenBg};
  border-radius: 18px;
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

const screenContentStyle = css`
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

const structuredContentStyle = css`
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

const inputAreaStyle = css`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.md};
`;

const inputWithStatusStyle = css`
  position: relative;
  width: 100%;
`;

const inputStyle = css`
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

const searchButtonStyle = css`
  padding: 10px;
  background-color: ${theme.colors.pokedexBlack};
  color: white;
  border: none;
  border-radius: ${theme.borders.radius.sm};
  cursor: pointer;
  font-family: ${theme.fonts.pixel};
  font-size: 14px;
  transition: all 0.2s;
  width: 45%;

  &:hover:not(:disabled) {
    background-color: #333;
    transform: translateY(-2px);
  }

  &:active:not(:disabled) {
    transform: translateY(1px);
  }

  &:disabled {
    background-color: ${theme.colors.pokedexBlack};
    cursor: not-allowed;
  }

  @media (max-width: ${theme.breakpoints.mobile}) {
    font-size: 12px;
  }
`;

const processingIndicatorStyle = css`
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

const speechErrorIndicatorStyle = css`
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  color: orange;
  font-size: 18px;
`;

const pulseRecording = keyframes`
  0% {
    box-shadow: 0 0 0 0 rgba(231, 76, 60, 0.7);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(231, 76, 60, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(231, 76, 60, 0);
  }
`;

const readButtonStyle = css`
  padding: 10px;
  background-color: ${theme.colors.pokedexBlack};
  color: white;
  border: none;
  border-radius: ${theme.borders.radius.sm};
  cursor: pointer;
  font-family: ${theme.fonts.pixel};
  font-size: 14px;
  transition: all 0.2s;
  width: 45%;

  &:active:not(:disabled) {
    transform: scale(0.95);
    background-color: ${theme.colors.pokedexLightRed};
  }

  &.speaking {
    background-color: rgba(255, 0, 0, 0.2);
  }

  &.listening {
    background-color: ${theme.colors.pokedexLightRed};
    animation: ${pulseRecording} 1.5s infinite;
  }

  &.processing {
    background-color: ${theme.colors.pokedexYellow};
    cursor: wait;
  }

  &.paused {
    background-color: ${theme.colors.pokedexYellow};
  }
`;

export default function PokedexRight({
  structuredData,
  activeSection,
  handleSectionChange,
  displayText,
  loading,
  displayRef,
  contentRef,
  isProcessing,
  speechError,
  isSpeaking,
  onSpeak,
  onStop,
  stopListening,
  setLoading,
  stopSpeaking,
  handleProcessQuery,
  isPaused,
  onResume,
}) {
  const formRef = useRef(null);
  const [input, setInput] = useState("");

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();

    const userQuery = input.trim();
    if (!userQuery || loading) return;

    setInput("");
    stopListening();
    setLoading(true);
    stopSpeaking();

    await handleProcessQuery(userQuery);
  };

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
      <div css={structuredContentStyle}>
        <h2>{section.title}</h2>
        <div ref={contentRef}>
          <ReactMarkdown>{section.content || ""}</ReactMarkdown>
        </div>
      </div>
    );
  };

  return (
    <div css={pokedexRightContainerStyle}>
      <div css={screenContainerStyle}>
        <SectionTabs
          sections={structuredData?.sections}
          activeSection={activeSection}
          handleSectionChange={handleSectionChange}
        />

        <div css={screenStyle}>
          <div css={screenContentStyle} ref={displayRef}>
            {renderStructuredContent()}
          </div>
        </div>

        <form css={inputAreaStyle} ref={formRef} onSubmit={handleSubmit}>
          <div css={inputWithStatusStyle}>
            <input
              css={inputStyle}
              type="text"
              value={isProcessing ? "Processing speech..." : input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                speechError === "microphone_access_error"
                  ? "Microphone access denied - type your query"
                  : "Ask Pokédex... or press and hold 🎤 to speak"
              }
              disabled={loading || isProcessing}
            />
            {isProcessing && <div css={processingIndicatorStyle} />}
            {speechError && !isProcessing && (
              <div
                css={speechErrorIndicatorStyle}
                title={`Error: ${speechError}`}
              >
                ⚠️
              </div>
            )}
          </div>

          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <button
              onClick={isSpeaking ? (isPaused ? onResume : onStop) : onSpeak}
              css={[
                readButtonStyle,
                isSpeaking && !isPaused && css`&.speaking`,
                isPaused && css`&.paused`,
              ]}
              title={
                isPaused
                  ? "Resume reading"
                  : isSpeaking
                  ? "Stop reading"
                  : "Read aloud"
              }
              disabled={
                isProcessing ||
                loading ||
                (!displayText && (!structuredData || !structuredData.sections))
              }
              type="button"
            >
              <span
                role="img"
                aria-label={
                  isPaused
                    ? "Resume reading"
                    : isSpeaking
                    ? "Stop reading"
                    : "Read aloud"
                }
              >
                {isPaused ? "RESUME" : isSpeaking ? "STOP" : "READ"}
              </span>
            </button>

            <button
              css={searchButtonStyle}
              type="submit"
              disabled={loading || isProcessing || !input.trim()}
            >
              SEARCH
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
