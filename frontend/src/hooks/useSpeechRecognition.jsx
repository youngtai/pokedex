import { useState, useRef, useCallback } from "react";

const useSpeechRecognition = ({
  onResult = () => {},
  autoSubmit = true,
} = {}) => {
  const [transcript, setTranscript] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  const startListening = useCallback(async () => {
    setError(null);
    setTranscript("");
    chunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const options = { mimeType: "audio/webm" };
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.onstart = () => {
        setIsListening(true);
        chunksRef.current = [];
      };

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        setIsListening(false);
        setIsProcessing(true);

        try {
          const audioBlob = new Blob(chunksRef.current, { type: "audio/webm" });

          const formData = new FormData();
          formData.append("data", audioBlob, "recording.webm");

          console.log("Sending speech to server for transcription...");
          const response = await fetch("/service/speech-to-text", {
            method: "POST",
            body: formData,
          });

          if (!response.ok) {
            const errorText = await response.text();
            console.error("Speech-to-text error:", errorText);
            throw new Error(`Server error: ${response.status}`);
          }

          const data = await response.json();
          if (data.transcript && data.transcript.trim()) {
            console.log("Transcription received:", data.transcript);
            const transcribedText = data.transcript.trim();
            setTranscript(transcribedText);
            onResult(transcribedText, autoSubmit);
          } else {
            console.error(
              "No transcript in response or empty transcript:",
              data
            );
            setError("no_transcript");
          }
        } catch (err) {
          console.error("Speech recognition error:", err);
          setError("processing_error");
        } finally {
          setIsProcessing(false);

          if (mediaRecorderRef.current) {
            const tracks = mediaRecorderRef.current.stream.getTracks();
            tracks.forEach((track) => track.stop());
          }
        }
      };

      mediaRecorder.start();
    } catch (err) {
      console.error("Error accessing microphone:", err);
      setError("microphone_access_error");
      setIsListening(false);
    }
  }, [onResult, autoSubmit]);

  const stopListening = useCallback(() => {
    if (mediaRecorderRef.current && isListening) {
      mediaRecorderRef.current.stop();
    }
  }, [isListening]);

  const resetTranscript = useCallback(() => {
    setTranscript("");
  }, []);

  const browserSupportsSpeechRecognition =
    !!navigator.mediaDevices && !!navigator.mediaDevices.getUserMedia;

  return {
    transcript,
    isListening,
    isProcessing,
    startListening,
    stopListening,
    resetTranscript,
    browserSupportsSpeechRecognition,
    error,
  };
};

export default useSpeechRecognition;
