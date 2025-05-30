import React, { useRef, useState } from "react";

const FaceCapture = ({ onCapture, disabled, visible, onClose, instruction }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [captured, setCaptured] = useState(false);
  const [error, setError] = useState("");
  const [cameraActive, setCameraActive] = useState(false);

  // Always stop camera when not capturing or visible
  const stopCamera = React.useCallback(() => {
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setCameraActive(false);
    }
  }, []);

  const startCamera = async () => {
    setError("");
    try {
      stopCamera();
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraActive(true);
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play().catch(() => {});
        };
      }
    } catch (err) {
      setError("Unable to access camera. Please allow camera access.");
    }
  };

  const capture = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext("2d");
    ctx.drawImage(videoRef.current, 0, 0, 240, 180);
    const dataUrl = canvasRef.current.toDataURL("image/jpeg");
    setCaptured(true);
    if (onCapture) onCapture(dataUrl);
    stopCamera();
  };

  const retake = () => {
    setCaptured(false);
    if (onCapture) onCapture(null);
    startCamera();
  };

  React.useEffect(() => {
    if (visible) {
      setCaptured(false);
      setError("");
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
    // eslint-disable-next-line
  }, [visible, stopCamera]);

  // Extra: stop camera if captured (not retaking)
  React.useEffect(() => {
    if (captured) {
      stopCamera();
    }
    // eslint-disable-next-line
  }, [captured, stopCamera]);

  if (!visible) {
    stopCamera();
    return null;
  }

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh",
      background: "rgba(0,0,0,0.92)", zIndex: 9999, display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center"
    }}>
      <div style={{ position: "relative", width: 320, height: 320 }}>
        <video
          ref={videoRef}
          width={320}
          height={320}
          style={{
            borderRadius: "50%",
            objectFit: "cover",
            filter: captured ? "grayscale(0.7)" : "none",
            boxShadow: "0 0 0 9999px rgba(0,0,0,0.6)",
          }}
          autoPlay
          playsInline
          muted
        />
        {/* Circle overlay */}
        <div style={{
          position: "absolute", top: 0, left: 0, width: 320, height: 320,
          borderRadius: "50%", border: "6px solid #1e88e5", boxSizing: "border-box",
          pointerEvents: "none"
        }} />
        {/* Canvas for captured image */}
        <canvas ref={canvasRef} width={240} height={180} style={{ display: "none" }} />
      </div>
      <div style={{ margin: "18px 0", color: "#fff", fontWeight: 600, fontSize: 18, textAlign: "center" }}>
        {instruction || "Align your face inside the circle"}
      </div>
      <div>
        {!captured ? (
          <button
            type="button"
            onClick={capture}
            disabled={disabled || !cameraActive}
            style={{
              background: "#1e88e5", color: "#fff", border: "none", borderRadius: 8,
              padding: "12px 32px", fontSize: 18, fontWeight: 700, margin: "0 8px", cursor: "pointer"
            }}
          >Capture</button>
        ) : (
          <button
            type="button"
            onClick={retake}
            style={{
              background: "#007bff", color: "#fff", border: "none", borderRadius: 8,
              padding: "12px 32px", fontSize: 18, fontWeight: 700, margin: "0 8px", cursor: "pointer"
            }}
          >Retake</button>
        )}
        <button
          type="button"
          onClick={() => { stopCamera(); if (onClose) onClose(); }}
          style={{
            background: "#f44336", color: "#fff", border: "none", borderRadius: 8,
            padding: "12px 32px", fontSize: 18, fontWeight: 700, margin: "0 8px", cursor: "pointer"
          }}
        >Close</button>
      </div>
      {error && <div style={{ color: "red", marginTop: 8 }}>{error}</div>}
    </div>
  );
};

export default FaceCapture;
