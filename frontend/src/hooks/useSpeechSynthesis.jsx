import { useRef, useState } from "react";

export default function useSpeechSynthesis() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const speechSynthRef = useRef(null);

  // Function to read text aloud with enhanced quality
  const speakText = (text) => {
    // Check if speech synthesis is available
    if (!window.speechSynthesis) {
      console.error("Speech synthesis not supported in this browser");
      return;
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    // Clean up the text for better speech synthesis
    const cleanText = text
      .replace(/\*\*/g, "") // Remove bold markdown
      .replace(/\*/g, "") // Remove italic markdown
      .replace(/#/g, "") // Remove heading markdown
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // Replace markdown links with just the text
      .replace(/\n\n/g, ". ") // Replace double newlines with periods for better pausing
      .replace(/\n/g, " ") // Replace single newlines with spaces
      .replace(/\s+/g, " ") // Normalize whitespace
      .trim();

    const utterance = new SpeechSynthesisUtterance(cleanText);

    // Configure better speech parameters
    utterance.rate = 1.0; // Speed of speech (0.1 to 10)
    utterance.pitch = 1.0; // Pitch (0 to 2)
    utterance.volume = 1.0; // Volume (0 to 1)

    // Split long text to prevent cutting off (Chrome limitation)
    const maxLength = 200;
    if (cleanText.length > maxLength) {
      // Split text at sentence boundaries
      const sentences = cleanText.match(/[^.!?]+[.!?]+/g) || [cleanText];
      let currentText = "";

      sentences.forEach((sentence, index) => {
        currentText += sentence;

        // Speak each chunk when we reach max length or at the end
        if (currentText.length > maxLength || index === sentences.length - 1) {
          const chunkUtterance = new SpeechSynthesisUtterance(currentText);
          chunkUtterance.rate = utterance.rate;
          chunkUtterance.pitch = utterance.pitch;
          chunkUtterance.volume = utterance.volume;

          if (index === 0) {
            chunkUtterance.onstart = () => setIsSpeaking(true);
          }

          if (index === sentences.length - 1) {
            chunkUtterance.onend = () => setIsSpeaking(false);
          }

          window.speechSynthesis.speak(chunkUtterance);
          currentText = "";
        }
      });
    } else {
      // For shorter text, just use the original utterance
      utterance.onstart = () => {
        setIsSpeaking(true);
      };

      utterance.onend = () => {
        setIsSpeaking(false);
      };

      utterance.onerror = (event) => {
        console.error("Speech synthesis error:", event);
        setIsSpeaking(false);
      };

      speechSynthRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    }
  };

  // Function to stop reading
  const stopSpeaking = () => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  return {
    isSpeaking,
    speakText,
    stopSpeaking,
  };
}
