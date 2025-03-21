import { useRef, useState, useEffect } from "react";

export default function useSpeechSynthesis() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const textToSpeakRef = useRef("");
  const utterancesRef = useRef([]);
  const currentPositionRef = useRef(0);

  useEffect(() => {
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const cleanTextForSpeech = (text) => {
    return text
      .replace(/\*\*/g, "")
      .replace(/\*/g, "")
      .replace(/#/g, "")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .replace(/\n\n/g, ". ")
      .replace(/\n/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  };

  const speakSegment = (text, position = 0) => {
    if (!window.speechSynthesis) {
      console.error("Speech synthesis not supported in this browser");
      return;
    }
    window.speechSynthesis.cancel();

    if (!text || position >= text.length) {
      setIsSpeaking(false);
      setIsPaused(false);
      currentPositionRef.current = 0;
      return;
    }

    const remainingText = text.substring(position);

    const utterance = new SpeechSynthesisUtterance(remainingText);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    utterance.onstart = () => {
      setIsSpeaking(true);
      setIsPaused(false);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      setIsPaused(false);
      currentPositionRef.current = 0;
    };

    utterance.onerror = (event) => {
      console.error("Speech synthesis error:", event);
      setIsSpeaking(false);
      setIsPaused(false);
    };

    utterancesRef.current = [utterance];
    window.speechSynthesis.speak(utterance);
  };

  const speakText = (text) => {
    const cleanText = cleanTextForSpeech(text);
    textToSpeakRef.current = cleanText;
    currentPositionRef.current = 0;

    speakSegment(cleanText, 0);
  };

  const toggleSpeaking = () => {
    if (!window.speechSynthesis) return;

    if (isSpeaking && !isPaused) {
      window.speechSynthesis.cancel();
      setIsPaused(true);
      setIsSpeaking(false);

      currentPositionRef.current = Math.floor(
        textToSpeakRef.current.length / 2
      );
    } else if (isPaused) {
      speakSegment(textToSpeakRef.current, currentPositionRef.current);
    }
  };

  const stopSpeaking = () => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      utterancesRef.current = [];
      textToSpeakRef.current = "";
      currentPositionRef.current = 0;
      setIsSpeaking(false);
      setIsPaused(false);
    }
  };

  return {
    isSpeaking: isSpeaking || isPaused,
    isPaused,
    speakText,
    stopSpeaking,
    toggleSpeaking,
  };
}
