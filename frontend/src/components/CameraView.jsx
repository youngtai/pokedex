import { css } from "@emotion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { theme } from "../theme";

const cameraContainerStyle = css`
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background-color: #000;
`;

const videoStyle = css`
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 5px;
`;

const overlayStyle = css`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  align-items: center;
  padding-bottom: 15px;
`;

const captureButtonStyle = css`
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.8);
  border: 3px solid white;
  cursor: pointer;
  transition: all 0.2s ease-in-out;

  &:hover {
    transform: scale(1.1);
    background-color: white;
  }

  &:active {
    transform: scale(0.95);
  }
`;

const innerButtonStyle = css`
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background-color: ${theme.colors.pokedexRed};
  margin: 5px auto;
`;

const errorMessageStyle = css`
  color: white;
  background-color: rgba(0, 0, 0, 0.7);
  padding: 10px;
  border-radius: 5px;
  margin-bottom: 10px;
  text-align: center;
`;

const CameraView = ({ onCapture, onClose }) => {
  const videoRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const canvasRef = useRef(null);
  const [error, setError] = useState(null);

  const initCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        mediaStreamRef.current = stream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      setError(
        "Could not access camera. Please make sure you've granted camera permissions."
      );
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
  }, []);

  useEffect(() => {
    initCamera();

    return () => {
      stopCamera();
    };
  }, [initCamera, stopCamera]);

  const captureImage = useCallback(() => {
    if (!videoRef.current || !mediaStreamRef.current) return;

    // Create canvas if it doesn't exist
    if (!canvasRef.current) {
      canvasRef.current = document.createElement("canvas");
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const context = canvas.getContext("2d");
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert to blob and then to file
    canvas.toBlob(
      (blob) => {
        const file = new File([blob], "pokemon-capture.jpg", {
          type: "image/jpeg",
        });
        onCapture(file);
        stopCamera();
      },
      "image/jpeg",
      0.9
    );
  }, [onCapture, stopCamera]);

  return (
    <div css={cameraContainerStyle}>
      <video ref={videoRef} css={videoStyle} autoPlay playsInline />
      <div css={overlayStyle}>
        {error && <div css={errorMessageStyle}>{error}</div>}
        <div css={captureButtonStyle} onClick={captureImage} title="Take Photo">
          <div css={innerButtonStyle}></div>
        </div>
      </div>
    </div>
  );
};

export default CameraView;
