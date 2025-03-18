import React from "react";
import ReactMarkdown from "react-markdown";
import SectionTabs from "./SectionTabs";
import SpeechControls from "./SpeechControls";

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
      <div className="structured-content">
        <h2>{section.title}</h2>
        <div ref={contentRef}>
          <ReactMarkdown>{section.content || ""}</ReactMarkdown>
        </div>
      </div>
    );
  };

  return (
    <div className="pokedex-right">
      <div className="pokedex-right-top">
        <div className="small-light green"></div>

        <SpeechControls
          isSpeaking={isSpeaking}
          onSpeak={speakCurrentSection}
          onStop={stopSpeaking}
          isListening={isListening}
          isProcessing={isProcessing}
          onStartListening={startListening}
          onStopListening={stopListening}
        />
      </div>

      <div className="pokedex-right-screen-container">
        <SectionTabs
          sections={structuredData?.sections}
          activeSection={activeSection}
          handleSectionChange={handleSectionChange}
        />

        <div className="pokedex-right-screen">
          <div className="right-screen-content" ref={displayRef}>
            {renderStructuredContent()}
          </div>
        </div>

        <form
          ref={formRef}
          onSubmit={handleSubmit}
          className="pokedex-input-area"
        >
          <div className="input-with-status">
            <input
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
              className="pokedex-input"
            />
            {isListening && <div className="listening-indicator"></div>}
            {isProcessing && <div className="processing-indicator"></div>}
            {speechError && !isListening && !isProcessing && (
              <div
                className="speech-error-indicator"
                title={`Error: ${speechError}`}
              >
                ⚠️
              </div>
            )}
          </div>
          <button
            type="submit"
            disabled={
              loading || isProcessing || (!input.trim() && !transcript.trim())
            }
            className="pokedex-button"
          >
            SEARCH
          </button>
        </form>
      </div>
    </div>
  );
}
