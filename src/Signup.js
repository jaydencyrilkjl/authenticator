import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import StyledAlert from "./components/StyledAlert";
import FaceCapture from "./components/FaceCapture";
import { ThemeContext } from "./App";

function Signup() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [faceImages, setFaceImages] = useState([]);
  const [showFaceModal, setShowFaceModal] = useState(false);
  const [faceCaptureStep, setFaceCaptureStep] = useState(0); // 0 = not started, 1+ = capturing
  const [alertMessage, setAlertMessage] = useState(""); // State for alert message
  const [showAlert, setShowAlert] = useState(false); // State to show/hide alert
  const [showSpinner, setShowSpinner] = useState(false); // State for spinner overlay
  const navigate = useNavigate();
  const { theme } = useContext(ThemeContext); // Use ThemeContext

  const requiredFaceImages = 3; // Minimum images to capture

  const showAlertMessage = (message) => {
    setAlertMessage(message);
    setShowAlert(true);
  };

  const closeAlert = () => {
    setShowAlert(false);
    setAlertMessage("");
  };

  useEffect(() => {
    // Get the referral code from the URL query parameters
    const params = new URLSearchParams(window.location.search);
    const code = params.get("referralCode");
    if (code) {
      setReferralCode(code); // Pre-fill the referral code field
    }
  }, []);

  const togglePassword = (fieldId) => {
    const field = document.getElementById(fieldId);
    field.type = field.type === "password" ? "text" : "password";
  };

  const handleSignupWithFaceDescriptors = async (trimmedReferralCode) => {
    setShowSpinner(true); // Show spinner during API call
    try {
      // Convert each image (data URL or HTMLImageElement) to base64 JPEG string
      const base64FaceImages = await Promise.all(faceImages.map(async (img) => {
        if (typeof img === 'string' && img.startsWith('data:image/')) {
          // Already a data URL
          return img;
        } else if (img instanceof HTMLImageElement) {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, img.width, img.height);
          return canvas.toDataURL('image/jpeg', 0.8);
        } else {
          // Fallback: return as-is (should not happen)
          return img;
        }
      }));

      const response = await fetch("https://tradespots.online/api/auth/signup", {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fullName: fullName,
          email: email,
          password: password,
          walletAddress: walletAddress,
          referralCode: trimmedReferralCode,
          faceImages: base64FaceImages, // Send array of base64 images
        }),
      });
      const result = await response.json();
      setShowSpinner(false);
      if (response.ok) {
        navigate("/login");
      } else {
        showAlertMessage(result.message || "Signup failed");
      }
    } catch (error) {
      setShowSpinner(false);
      showAlertMessage("Unable to connect to server for signup.");
      console.error(error);
    }
  };

  const handleSignup = async (event) => {
    event.preventDefault();

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      showAlertMessage("Please enter a valid email address.");
      return;
    }

    if (!walletAddress.match(/^T[a-zA-Z0-9]{33}$/)) {
      showAlertMessage("Please enter a valid TRC-20 wallet address.");
      return;
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/;
    if (!passwordRegex.test(password)) {
      showAlertMessage(
        "Password must be at least 8 characters long, include at least 1 lowercase letter, 1 uppercase letter, and 1 number."
      );
      return;
    }

    if (password !== confirmPassword) {
      showAlertMessage("Passwords do not match!");
      return;
    }

    const trimmedReferralCode = referralCode.trim();
    if (!trimmedReferralCode) {
      showAlertMessage("Referral code is required.");
      return;
    }

    if (faceImages.length < requiredFaceImages) {
      setFaceCaptureStep(1);
      setShowFaceModal(true);
      return;
    }

    setShowSpinner(true); // Show spinner while preparing to send data
    await handleSignupWithFaceDescriptors(trimmedReferralCode);
  };

  const handleFaceModalCapture = (img) => {
    if (img) {
      setFaceImages((prev) => [...prev, img]);
      if (faceImages.length + 1 < requiredFaceImages) {
        setFaceCaptureStep(faceCaptureStep + 1);
      } else {
        setShowFaceModal(false);
        setFaceCaptureStep(0);
        showAlertMessage("Face images captured. Please click Sign Up again to submit.");
      }
    }
  };

  const handleFaceModalClose = () => {
    setShowFaceModal(false);
    setFaceCaptureStep(0);
  };

  return (
    <div
      style={{
        backgroundColor: theme === 'dark' ? '#121212' : '#f2f4f8',
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        fontFamily: "'Segoe UI', sans-serif",
        color: theme === 'dark' ? '#f1f1f1' : '#333',
        flexDirection: "column"
      }}
    >
      {showSpinner && (
        <div style={{
          position: "fixed",
          top: 0, left: 0, width: "100vw", height: "100vh",
          background: "rgba(0,0,0,0.7)",
          zIndex: 9999,
          display: "flex",
          justifyContent: "center",
          alignItems: "center"
        }}>
          <div style={{
            width: "60px",
            height: "60px",
            border: "6px solid #f3f3f3",
            borderTop: `6px solid ${theme === 'dark' ? '#1e88e5' : '#007bff'}`,
            borderRadius: "50%",
            animation: "spin 1s linear infinite"
          }} />
          <style>
            {`@keyframes spin { 100% { transform: rotate(360deg); } }`}
          </style>
        </div>
      )}
      {showAlert && <StyledAlert message={alertMessage} onClose={closeAlert} />}
      <div
        style={{
          background: theme === 'dark' ? '#333' : "#fff",
          borderTop: `4px solid ${theme === 'dark' ? '#1e88e5' : '#007bff'}`,
          borderRadius: "12px",
          padding: "30px",
          width: "350px",
          boxShadow: theme === 'dark'
            ? "0 8px 20px rgba(255,255,255,0.15)"
            : "0 8px 20px rgba(0, 0, 0, 0.15)",
          position: "relative",
        }}
      >
        <button
          style={{
            position: "absolute",
            top: "30px",
            right: "20px",
            backgroundColor: theme === 'dark' ? '#1e88e5' : '#007bff',
            color: "#fff",
            padding: "8px 14px",
            borderRadius: "6px",
            textDecoration: "none",
            fontSize: "10px",
            fontWeight: "bold",
            boxShadow: theme === 'dark'
              ? "0 4px 10px rgba(255,255,255,0.1)"
              : "0 4px 10px rgba(0, 0, 0, 0.1)",
            transition: "background-color 0.3s ease, transform 0.2s ease",
            border: "none",
          }}
          onClick={() => navigate("/")}
        >
          Home
        </button>
        <h2
          style={{
            textAlign: "center",
            marginBottom: "20px",
            borderBottom: `2px solid ${theme === 'dark' ? '#1e88e5' : '#007bff'}`,
            paddingBottom: "10px",
            fontSize: "28px",
            color: theme === 'dark' ? '#f1f1f1' : '#333',
          }}
        >
          Sign Up
        </h2>
        <form id="signupForm" onSubmit={handleSignup}>
          <label
            htmlFor="fullName"
            style={{
              color: theme === 'dark' ? '#f1f1f1' : '#333',
              fontWeight: "bold",
              display: "block",
              margin: "10px 0 5px",
            }}
          >
            Full Name:
          </label>
          <input
            type="text"
            id="fullName"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            style={{
              width: "100%",
              padding: "10px",
              marginBottom: "10px",
              border: `1px solid ${theme === 'dark' ? '#555' : '#ccc'}`,
              borderRadius: "5px",
              fontSize: "16px",
              boxSizing: "border-box",
              background: theme === 'dark' ? '#222' : '#fff',
              color: theme === 'dark' ? '#f1f1f1' : '#333',
            }}
          />
          <label
            htmlFor="email"
            style={{
              color: theme === 'dark' ? '#f1f1f1' : '#333',
              fontWeight: "bold",
              display: "block",
              margin: "10px 0 5px",
            }}
          >
            Email:
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{
              width: "100%",
              padding: "10px",
              marginBottom: "10px",
              border: `1px solid ${theme === 'dark' ? '#555' : '#ccc'}`,
              borderRadius: "5px",
              fontSize: "16px",
              boxSizing: "border-box",
              background: theme === 'dark' ? '#222' : '#fff',
              color: theme === 'dark' ? '#f1f1f1' : '#333',
            }}
          />
          <label
            htmlFor="password"
            style={{
              color: theme === 'dark' ? '#f1f1f1' : '#333',
              fontWeight: "bold",
              display: "block",
              margin: "10px 0 5px",
            }}
          >
            Password:
          </label>
          <div style={{ position: "relative" }}>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: "100%",
                padding: "10px",
                marginBottom: "10px",
                border: `1px solid ${theme === 'dark' ? '#555' : '#ccc'}`,
                borderRadius: "5px",
                fontSize: "16px",
                boxSizing: "border-box",
                background: theme === 'dark' ? '#222' : '#fff',
                color: theme === 'dark' ? '#f1f1f1' : '#333',
              }}
            />
            <button
              type="button"
              onClick={() => togglePassword("password")}
              style={{
                position: "absolute",
                right: "10px",
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                fontSize: "18px",
                cursor: "pointer",
                color: theme === 'dark' ? '#1e88e5' : '#007bff',
              }}
            >
              👁
            </button>
          </div>
          <label
            htmlFor="confirmPassword"
            style={{
              color: theme === 'dark' ? '#f1f1f1' : '#333',
              fontWeight: "bold",
              display: "block",
              margin: "10px 0 5px",
            }}
          >
            Confirm Password:
          </label>
          <div style={{ position: "relative" }}>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              style={{
                width: "100%",
                padding: "10px",
                marginBottom: "10px",
                border: `1px solid ${theme === 'dark' ? '#555' : '#ccc'}`,
                borderRadius: "5px",
                fontSize: "16px",
                boxSizing: "border-box",
                background: theme === 'dark' ? '#222' : '#fff',
                color: theme === 'dark' ? '#f1f1f1' : '#333',
              }}
            />
            <button
              type="button"
              onClick={() => togglePassword("confirmPassword")}
              style={{
                position: "absolute",
                right: "10px",
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                fontSize: "18px",
                cursor: "pointer",
                color: theme === 'dark' ? '#1e88e5' : '#007bff',
              }}
            >
              👁
            </button>
          </div>
          <label
            htmlFor="walletAddress"
            style={{
              color: theme === 'dark' ? '#f1f1f1' : '#333',
              fontWeight: "bold",
              display: "block",
              margin: "10px 0 5px",
            }}
          >
            Wallet Address:
          </label>
          <input
            type="text"
            id="walletAddress"
            value={walletAddress}
            onChange={(e) => setWalletAddress(e.target.value)}
            required
            placeholder={walletAddress === "" ? "We support USDT-TRC20 only" : ""}
            style={{
              width: "100%",
              padding: "10px",
              marginBottom: "10px",
              border: `1px solid ${theme === 'dark' ? '#555' : '#ccc'}`,
              borderRadius: "5px",
              fontSize: "16px",
              boxSizing: "border-box",
              background: theme === 'dark' ? '#222' : '#fff',
              color: theme === 'dark' ? '#f1f1f1' : '#333',
            }}
          />
          <label
            htmlFor="referralCode"
            style={{
              color: theme === 'dark' ? '#f1f1f1' : '#333',
              fontWeight: "bold",
              display: "block",
              margin: "10px 0 5px",
            }}
          >
            Referral Code:
          </label>
          <input
            type="text"
            id="referralCode"
            value={referralCode}
            onChange={(e) => setReferralCode(e.target.value)}
            placeholder="Enter referral code"
            style={{
              width: "100%",
              padding: "10px",
              marginBottom: "10px",
              border: `1px solid ${theme === 'dark' ? '#555' : '#ccc'}`,
              borderRadius: "5px",
              fontSize: "16px",
              boxSizing: "border-box",
              background: theme === 'dark' ? '#222' : '#fff',
              color: theme === 'dark' ? '#f1f1f1' : '#333',
            }}
          />
          <label
            style={{
              color: theme === 'dark' ? '#f1f1f1' : '#333',
              fontWeight: "bold",
              display: "block",
              margin: "10px 0 5px",
            }}
          >
            Face Verification (Required: {requiredFaceImages} images, different angles/lighting etc.)
          </label>
          <div style={{ margin: "10px 0" }}>
            {faceImages.map((img, idx) => (
              <div key={idx} style={{ display: "inline-block", marginRight: 8, position: "relative" }}>
                <img src={img} alt={`face-${idx}`} width={60} height={45} style={{ borderRadius: 6, border: "1px solid #ccc" }} />
                <button
                  type="button"
                  onClick={() => setFaceImages(faceImages.filter((_, i) => i !== idx))}
                  style={{
                    position: "absolute", top: 0, right: 0, background: "#f00", color: "#fff", border: "none", borderRadius: "50%", width: 18, height: 18, cursor: "pointer", fontSize: 12
                  }}
                >×</button>
              </div>
            ))}
            <div style={{ color: "#888", fontSize: 12 }}>
              {faceImages.length} / {requiredFaceImages} images captured
            </div>
          </div>
          <button
            type="submit"
            style={{
              width: "100%",
              padding: "10px",
              backgroundColor: theme === 'dark' ? '#1e88e5' : '#007bff',
              color: "#fff",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
              fontSize: "16px",
              transition: "background-color 0.3s ease, transform 0.3s ease",
            }}
          >
            Sign Up
          </button>
        </form>
        <p
          style={{
            textAlign: "center",
            marginTop: "15px",
            color: theme === 'dark' ? '#f1f1f1' : '#333',
          }}
        >
          Already have an account?{" "}
          <button
            onClick={() => navigate("/Login")}
            style={{
              background: "none",
              border: "none",
              color: theme === 'dark' ? '#1e88e5' : '#007bff',
              textDecoration: "underline",
              cursor: "pointer",
              padding: 0,
            }}
          >
            Login
          </button>
        </p>
      </div>
      {showFaceModal && (
        <FaceCapture
          visible={showFaceModal}
          onCapture={handleFaceModalCapture}
          onClose={handleFaceModalClose}
          instruction={`Step ${faceImages.length + 1} of ${requiredFaceImages}: Align your face in the circle and capture`}
        />
      )}
    </div>
  );
}

export default Signup;