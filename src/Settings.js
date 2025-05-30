import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { ThemeContext, BotVisibilityContext } from "./App";
import StyledAlert from "./components/StyledAlert";
import FaceCapture from "./components/FaceCapture";
import { TOTP } from 'totp-generator';
import { encode as base32Encode } from 'hi-base32';
import { QRCodeCanvas } from 'qrcode.react';

function isApp() {
  // Only return true if running inside a native Capacitor/Cordova app
  return (
    typeof window !== 'undefined' &&
    (
      (window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform()) ||
      window.cordova
    )
  );
}

// Gradient button style for reuse
const gradientButtonStyle = {
  padding: "10px 16px",
  background: "linear-gradient(90deg, #00bfff, #0056b3)",
  color: "#fff",
  border: "none",
  borderRadius: "6px",
  fontWeight: "bold",
  cursor: "pointer",
  transition: "background 0.3s, transform 0.2s",
  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
  width: "90%",
  maxWidth: "115px",
  margin: "16px 0",
  display: 'block',
};

// Pure JS math parser (no eval, no Function)
function safeEval(expr) {
  // Remove spaces
  expr = expr.replace(/\s+/g, '');
  // Validate allowed characters
  if (!/^[\d+\-*/.()]+$/.test(expr)) throw new Error("Invalid characters");

  // Shunting Yard Algorithm to convert to Reverse Polish Notation (RPN)
  const output = [];
  const ops = [];
  const precedence = { '+': 1, '-': 1, '*': 2, '/': 2 };
  const associativity = { '+': 'L', '-': 'L', '*': 'L', '/': 'L' };
  let i = 0;
  while (i < expr.length) {
    let token = expr[i];
    if (/\d|\./.test(token)) {
      // Parse number (including decimals)
      let num = '';
      while (i < expr.length && /[\d.]/.test(expr[i])) num += expr[i++];
      output.push(parseFloat(num));
      continue;
    }
    if ('+-*/'.includes(token)) {
      while (
        ops.length &&
        '+-*/'.includes(ops[ops.length - 1]) &&
        (
          (associativity[token] === 'L' && precedence[token] <= precedence[ops[ops.length - 1]]) ||
          (associativity[token] === 'R' && precedence[token] < precedence[ops[ops.length - 1]])
        )
      ) {
        output.push(ops.pop());
      }
      ops.push(token);
    } else if (token === '(') {
      ops.push(token);
    } else if (token === ')') {
      while (ops.length && ops[ops.length - 1] !== '(') output.push(ops.pop());
      if (!ops.length) throw new Error("Mismatched parentheses");
      ops.pop(); // Remove '('
    } else {
      throw new Error("Invalid token");
    }
    i++;
  }
  while (ops.length) {
    const op = ops.pop();
    if (op === '(' || op === ')') throw new Error("Mismatched parentheses");
    output.push(op);
  }

  // Evaluate RPN
  const stack = [];
  for (const token of output) {
    if (typeof token === 'number') {
      stack.push(token);
    } else {
      const b = stack.pop();
      const a = stack.pop();
      if (token === '+') stack.push(a + b);
      else if (token === '-') stack.push(a - b);
      else if (token === '*') stack.push(a * b);
      else if (token === '/') stack.push(a / b);
      else throw new Error("Unknown operator");
    }
  }
  if (stack.length !== 1) throw new Error("Invalid expression");
  return stack[0];
}

function TwoFactorAuthSetup({ userEmail, onVerified, showCopyButton, onSuccess }) {
  const [secret, setSecret] = useState('');
  const [qr, setQr] = useState('');
  const [inputCode, setInputCode] = useState('');
  const [step, setStep] = useState('setup');
  const [error, setError] = useState('');
  const [copySuccess, setCopySuccess] = useState('');
  const [success, setSuccess] = useState(false);

  // Generate a random secret (20 bytes, base32)
  function generateSecret() {
    const array = new Uint8Array(20);
    window.crypto.getRandomValues(array);
    // Only allow valid base32 chars (A-Z, 2-7), uppercase, no padding
    return base32Encode(array).replace(/[^A-Z2-7]/gi, '').toUpperCase();
  }

  useEffect(() => {
    // Generate a new secret and QR code
    const newSecret = generateSecret();
    setSecret(newSecret);
    // otpauth://totp/TradeSpot:user@tradespot.com?secret=SECRET&issuer=TradeSpot
    const otpauth = `otpauth://totp/TradeSpot:${encodeURIComponent(userEmail || 'user@tradespot.com')}?secret=${newSecret}&issuer=TradeSpot`;
    setQr(otpauth);
  }, [userEmail]);

  // TOTP code verification using totp-generator
  const handleVerify = () => {
    setError('');
    try {
      // TOTP.generate expects secret as a string (base32), period=30s, 6 digits
      const totpResult = TOTP.generate(secret, { digits: 6, period: 60 });
      const generatedCode = totpResult.otp || totpResult;
      if (inputCode === generatedCode) {
        // Save to backend for persistence
        fetch('https://tradespots.online/api/auth/enable-2fa', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: localStorage.getItem('userId'), secret }),
        })
          .then(res => res.json())
          .then(data => {
            if (data.success) {
              setStep('done');
              setSuccess(true);
              if (onVerified) onVerified(secret);
              if (onSuccess) onSuccess();
              // Set a flag for authenticator page to sense success
              localStorage.setItem('tsauth_2fa_success', '1');
              setTimeout(() => {
                setSuccess(false);
              }, 2500);
              // Refresh settings page immediately
              window.location.reload();
            } else {
              setError('Failed to enable 2FA: ' + (data.error || 'Unknown error'));
            }
          })
          .catch(err => setError('Failed to enable 2FA: ' + err.message));
      } else {
        setError('Invalid code. Please try again.');
      }
    } catch (e) {
      setError('Error verifying code.');
      console.error('[2FA ERROR]', e);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(secret);
      setCopySuccess('Copied!');
      setTimeout(() => setCopySuccess(''), 1200);
    } catch (err) {
      setCopySuccess('Failed');
      setTimeout(() => setCopySuccess(''), 1200);
    }
  };

  // Card style for consistency
  const cardStyle = {
    border: '1px solid #eee',
    borderRadius: 8,
    padding: 16,
    maxWidth: 350,
    margin: '24px auto',
    background: '#fafbfc',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  };

  if (step === 'done')
    return (
      <div style={cardStyle}>
        <h3>Enable Two-Factor Authentication</h3>
        <ol style={{textAlign:'left',fontSize:14}}>
          <li>Download and open the <b>TradeSpot Authenticator</b> app on your phone.</li>
          <li>Scan this QR code or enter the secret key manually:</li>
        </ol>
        <div style={{margin:'16px 0'}}>
          <QRCodeCanvas value={qr} size={160} />
          <div style={{fontSize:13,marginTop:8,display:'flex',alignItems:'center',gap:8}}>
            <b>Secret:</b> <span style={{fontFamily:'monospace',userSelect:'all'}}>{secret}</span>
            {showCopyButton && (
              <button
                onClick={handleCopy}
                style={{
                  padding: '7px 12px',
                  fontSize: 15,
                  marginLeft: 4,
                  cursor: 'pointer',
                  borderRadius: 4,
                  border: '1px solid #00bfff',
                  background: '#e6f7ff',
                  color: '#0056b3',
                  minWidth: 0,
                  width: 28,
                  height: 24,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                title="Copy"
              >
                📋
              </button>
            )}
            {copySuccess && <span style={{color:'#00bfff',marginLeft:4,fontSize:12}}>{copySuccess}</span>}
          </div>
        </div>
        <div style={{margin:'12px 0'}}>Enter the 6-digit code from your app:</div>
        <input type="text" maxLength={6} value={inputCode} onChange={e=>setInputCode(e.target.value)} style={{padding:8,width:'60%',fontSize:16}} />
        <button style={{marginLeft:8,padding:'8px 16px'}} onClick={handleVerify}>Verify</button>
        {error && <div style={{color:'red',marginTop:8}}>{error}</div>}
      </div>
    );

  return (
    <div style={{border:'1px solid #eee',borderRadius:8,padding:16,maxWidth:350,margin:'24px auto',background:'#fafbfc', position:'relative'}}>
      {success && (
        <div style={{
          position: 'absolute',
          top: -38,
          left: 0,
          width: '100%',
          background: '#d4edda',
          color: '#155724',
          border: '1px solid #c3e6cb',
          borderRadius: 6,
          padding: '8px 0',
          textAlign: 'center',
          fontWeight: 600,
          fontSize: 15,
          zIndex: 10
        }}>
          Authenticator setup successful!
        </div>
      )}
      <h3>Enable Two-Factor Authentication</h3>
      <ol style={{textAlign:'left',fontSize:14}}>
        <li>Download and open the <b>TradeSpot Authenticator</b> app on your phone.</li>
        <li>Scan this QR code or enter the secret key manually:</li>
      </ol>
      <div style={{margin:'16px 0'}}>
        <QRCodeCanvas value={qr} size={160} />
        <div style={{fontSize:13,marginTop:8,display:'flex',alignItems:'center',gap:8}}>
          <b>Secret:</b> <span style={{fontFamily:'monospace',userSelect:'all'}}>{secret}</span>
          {showCopyButton && (
            <button
              onClick={handleCopy}
              style={{
                padding: '2px 6px',
                fontSize: 11,
                marginLeft: 4,
                cursor: 'pointer',
                borderRadius: 4,
                border: '1px solid #00bfff',
                background: '#e6f7ff',
                color: '#0056b3',
                minWidth: 0,
                width: 28,
                height: 24,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title="Copy"
            >
              📋
            </button>
          )}
          {copySuccess && <span style={{color:'#00bfff',marginLeft:4,fontSize:12}}>{copySuccess}</span>}
        </div>
      </div>
      <div style={{margin:'12px 0'}}>Enter the 6-digit code from your app:</div>
      <input type="text" maxLength={6} value={inputCode} onChange={e=>setInputCode(e.target.value)} style={{padding:8,width:'60%',fontSize:16}} />
      <button style={{marginLeft:8,padding:'8px 16px'}} onClick={handleVerify}>Verify</button>
      {error && <div style={{color:'red',marginTop:8}}>{error}</div>}
    </div>
  );
}

const Settings = () => {
  const navigate = useNavigate();
  const userId = localStorage.getItem("userId");
  const [alertMessage, setAlertMessage] = useState("");
  const [alertCallback, setAlertCallback] = useState(null);
  const [showFundingPasswordModal, setShowFundingPasswordModal] = useState(false);
  const [showChangeNameModal, setShowChangeNameModal] = useState(false);
  const [showFundsLockModal, setShowFundsLockModal] = useState(false);
  const [fundsLocked, setFundsLocked] = useState(false);
  const [lockAction, setLockAction] = useState("disable"); // or "enable"
  const [lockSpotId, setLockSpotId] = useState("");
  const [lockFaceImg, setLockFaceImg] = useState(null);
  const [showLockFaceModal, setShowLockFaceModal] = useState(false);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);
  const { theme, toggleTheme } = useContext(ThemeContext);
  const { showBot, setShowBot } = useContext(BotVisibilityContext);
  const [calcValue, setCalcValue] = useState("");
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [changePasswordStep, setChangePasswordStep] = useState(1); // 1: enter passwords, 2: enter code
  const [changePasswordLoading, setChangePasswordLoading] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [passwordCode, setPasswordCode] = useState("");

  // Add state for password visibility toggles
  const [oldPasswordVisible, setOldPasswordVisible] = useState(false);
  const [newPasswordVisible, setNewPasswordVisible] = useState(false);
  const [confirmNewPasswordVisible, setConfirmNewPasswordVisible] = useState(false);
  // Add state for funding password visibility
  const [fundingPasswordVisible, setFundingPasswordVisible] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState("");

  // New state for lock action authenticator code
  const [lockAuthenticatorCode, setLockAuthenticatorCode] = useState("");

  // Add state for funding password authenticator code
  const [fundingAuthenticatorCode, setFundingAuthenticatorCode] = useState("");

  const [authSuccess, setAuthSuccess] = useState(false);

  useEffect(() => {
    if (!userId) {
      setAlertMessage("Please log in.");
      setAlertCallback(() => () => (window.location.href = "login.html"));
      return;
    }
    // Fetch fundsLocked from backend
    fetch(`https://tradespots.online/api/funds/fundsLocked?userId=${userId}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) setFundsLocked(data.fundsLocked);
      });
    // Fetch user email and 2FA status from backend
    fetch(`https://tradespots.online/api/auth/user/${userId}`)
      .then(res => res.json())
      .then(data => {
        if (data && data.email) setUserEmail(data.email);
        if (data && data.user && data.user.twoFactorEnabled) setTwoFactorEnabled(!!data.user.twoFactorEnabled);
      });
  }, [userId]);

  const handleApiResponse = (result, successCallback) => {
    setAlertMessage(result.success ? result.message : `Error: ${result.error}`);
    if (result.success && successCallback) successCallback();
  };

  const sendFundingCode = async () => {
    try {
      const response = await fetch(
        "https://tradespots.online/api/funds/fundingPasswordSendCode",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId }),
        }
      );
      const result = await response.json();
      handleApiResponse(result);
    } catch (error) {
      setAlertMessage(`Error sending code: ${error.message}`);
    }
  };

  const verifyAndUpdateFundingPassword = async () => {
    const newFundingPassword = document.getElementById("newFundingPassword").value.trim();
    const code = document.getElementById("verificationCode").value.trim();
    const authenticatorCode = fundingAuthenticatorCode.trim();
    if (!newFundingPassword || !code || !authenticatorCode) {
      setAlertMessage("Please fill in all required fields, including the authenticator code.");
      return;
    }
    if (!/^\d{8}$/.test(newFundingPassword)) {
      setAlertMessage("Funding password must be exactly 8 digits.");
      return;
    }
    try {
      const response = await fetch(
        "https://tradespots.online/api/funds/fundingPasswordVerifyAndUpdate",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, newFundingPassword, code, authenticatorCode }),
        }
      );
      const result = await response.json();
      handleApiResponse(result, () => {
        document.getElementById("newFundingPassword").value = "";
        document.getElementById("verificationCode").value = "";
        setFundingAuthenticatorCode("");
        setShowFundingPasswordModal(false);
      });
    } catch (error) {
      setAlertMessage(`Error updating funding password: ${error.message}`);
    }
  };

  const sendNameChangeCode = async () => {
    const newName = document.getElementById("newName").value.trim();
    if (!newName) {
      setAlertMessage("Please enter your new name.");
      return;
    }
    try {
      const response = await fetch(
        "https://tradespots.online/api/changeName/changeNameSendCode",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, newName }),
        }
      );
      const result = await response.json();
      handleApiResponse(result);
    } catch (error) {
      setAlertMessage(`Error: ${error.message}`);
    }
  };

  const verifyAndUpdateName = async () => {
    const code = document.getElementById("nameChangeCode").value.trim();
    const twoFACode = twoFactorCode.trim();
    if (!code) {
      setAlertMessage("Please enter the verification code.");
      return;
    }
    if (twoFactorEnabled && (!twoFACode || twoFACode.length !== 6)) {
      setAlertMessage("Please enter your 6-digit 2FA code.");
      return;
    }
    try {
      const response = await fetch(
        "https://tradespots.online/api/changeName/changeNameVerifyAndUpdate",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(twoFactorEnabled ? { userId, code, twoFactorCode: twoFACode } : { userId, code }),
        }
      );
      const result = await response.json();
      handleApiResponse(result, () => {
        document.getElementById("newName").value = "";
        document.getElementById("nameChangeCode").value = "";
        setTwoFactorCode("");
        setShowChangeNameModal(false); // Close modal
      });
    } catch (error) {
      setAlertMessage(`Error: ${error.message}`);
    }
  };

  const handleFundsLockClick = (action) => {
    setLockAction(action);
    setShowFundsLockModal(true);
    setLockSpotId("");
    setLockFaceImg(null);
  };

  const handleLockFaceCapture = (img) => {
    setShowLockFaceModal(false);
    setLockFaceImg(img);
  };

  const handleLockFaceModalClose = () => {
    setShowLockFaceModal(false);
  };

  const handleFundsLockVerify = async () => {
    if (!lockSpotId || lockSpotId.length !== 7) {
      setAlertMessage("Please enter your 7-digit SPOTID.");
      return;
    }
    if (lockAction === "disable") {
      if (!lockAuthenticatorCode || lockAuthenticatorCode.length !== 6) {
        setAlertMessage("Please enter your 6-digit authenticator code.");
        return;
      }
    }
    if (lockAction === "enable") {
      if (!lockFaceImg) {
        setAlertMessage("Please capture your face.");
        return;
      }
    }
    try {
      // Call new endpoint to verify SPOTID (+ face for enable, + 2FA for disable)
      const payload = {
        userId,
        spotId: lockSpotId,
        action: lockAction,
        authenticatorCode: lockAction === "disable" ? lockAuthenticatorCode : undefined,
        faceImage: lockAction === "enable" ? lockFaceImg : undefined
      };
      const response = await fetch("https://tradespots.online/api/funds/fundsLocked", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setFundsLocked(lockAction === "disable");
        setShowFundsLockModal(false);
        setAlertMessage(data.message || (lockAction === "disable" ? "Funds disabled." : "Funds enabled."));
        setLockSpotId("");
        setLockAuthenticatorCode("");
        setLockFaceImg(null);
      } else {
        setAlertMessage(data.error || "Failed to update funds lock status.");
      }
    } catch (error) {
      setAlertMessage(error.message || "Failed to update funds lock status.");
    }
  };

  const handlePlaystore = () => {
    alert("Feature coming soon");
  };

  const handleAPK = () => {
    window.open("https://eloquent-kashata-b27599.netlify.app/tradespot.apk", "_blank");
  };

  const handleVisitWebsite = () => {
    window.open("https://tradespot.online", "_blank");
  };

  const handleCalcClick = (val) => {
    if (val === "C") {
      setCalcValue("");
    } else if (val === "DEL") {
      setCalcValue((prev) => prev.slice(0, -1));
    } else if (val === "=") {
      const operators = ['+', '-', '*', '/'];
      const expr = calcValue;
      // Disallow empty or trailing operator
      if (
        !expr ||
        operators.includes(expr.slice(-1))
      ) {
        setCalcValue("Error");
        return;
      }
      try {
        const result = safeEval(expr);
        setCalcValue(result.toString());
      } catch (err) {
        alert("Calculation error: " + err.message); // Debug: show error cause
        setCalcValue("Error");
      }
    } else {
      // Prevent consecutive operators (e.g., "++", "--", etc.)
      const operators = ['+', '-', '*', '/'];
      if (
        operators.includes(val) &&
        calcValue &&
        operators.includes(calcValue.slice(-1))
      ) {
        // Replace last operator with new one
        setCalcValue((prev) => prev.slice(0, -1) + val);
        return;
      }
      setCalcValue((prev) => prev + val);
    }
  };

  const sendPasswordChangeCode = async () => {
    if (!oldPassword || !newPassword || !confirmNewPassword) {
      setAlertMessage("Please enter all password fields.");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setAlertMessage("New password and confirm password do not match.");
      return;
    }
    setChangePasswordLoading(true);
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch("https://tradespots.online/api/auth/sendPasswordChangeCode", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        // No body needed
      });
      const result = await response.json();
      setChangePasswordLoading(false);
      if (result.success) {
        setChangePasswordStep(2);
        setAlertMessage("Verification code sent to your email.");
      } else {
        setAlertMessage(result.message || "Failed to send code.");
      }
    } catch (error) {
      setChangePasswordLoading(false);
      setAlertMessage("Error sending code: " + error.message);
    }
  };

  const verifyAndChangePassword = async () => {
    if (!passwordCode) {
      setAlertMessage("Please enter the verification code.");
      return;
    }
    if (!oldPassword || !newPassword || !confirmNewPassword) {
      setAlertMessage("Please enter all password fields.");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setAlertMessage("New password and confirm password do not match.");
      return;
    }
    setChangePasswordLoading(true);
    try {
      const response = await fetch("https://tradespots.online/api/auth/changePassword", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, oldPassword, newPassword, confirmNewPassword, code: passwordCode }),
      });
      const result = await response.json();
      setChangePasswordLoading(false);
      if (result.success) {
        setShowChangePasswordModal(false);
        setOldPassword("");
        setNewPassword("");
        setConfirmNewPassword("");
        setPasswordCode("");
        setChangePasswordStep(1);
        setAlertMessage("Password changed successfully.");
      } else {
        setAlertMessage(result.message || "Failed to change password.");
      }
    } catch (error) {
      setChangePasswordLoading(false);
      setAlertMessage("Error: " + error.message);
    }
  };

  return (
    <div style={{ fontFamily: "'Segoe UI', sans-serif", backgroundColor: theme === 'dark' ? '#121212' : '#f2f4f8', color: theme === 'dark' ? '#f1f1f1' : '#333', padding: "20px", minHeight: "100vh", position: 'relative' }}>
      {/* StyledAlert */}
      {alertMessage && (
        <StyledAlert
          message={alertMessage}
          onClose={() => {
            setAlertMessage("");
            setAlertCallback(null);
          }}
          onConfirm={alertCallback}
        />
      )}

      {authSuccess && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          background: '#d4edda',
          color: '#155724',
          borderBottom: '2px solid #c3e6cb',
          padding: '14px 0',
          textAlign: 'center',
          fontWeight: 700,
          fontSize: 18,
          zIndex: 30000
        }}>
          Authenticator setup successful! Refreshing...
        </div>
      )}

      <button
        onClick={() => navigate("/dashboard")}
        style={{
          ...gradientButtonStyle,
          padding: "10px 20px",
          marginRight: 10,
          borderRadius: "5px"
        }}
      >
        🔙 Back
      </button>
      <div
        style={{
          background: theme === 'dark' ? '#333' : "#fff",
          padding: "30px",
          borderRadius: "12px",
          maxWidth: "600px",
          margin: "30px auto",
          boxShadow: theme === 'dark' ? "0 8px 20px rgba(255,255,255,0.15)" : "0 8px 20px rgba(0,0,0,0.15)",
        }}
      >
        <h2 style={{ textAlign: "center" }}>Change Name</h2>
        <button
          onClick={() => setShowChangeNameModal(true)}
          style={{
            ...gradientButtonStyle,
            display: "block",
            margin: "20px auto",
            padding: "10px 20px",
            borderRadius: "5px"
          }}
        >
          Update
        </button>
      </div>

      {showChangeNameModal && (
        <div
          style={{
            position: "fixed",
            zIndex: 1000,
            left: 0,
            top: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          onClick={(e) => e.target === e.currentTarget && setShowChangeNameModal(false)}
        >
          <div
            style={{
              backgroundColor: theme === 'dark' ? '#333' : "#fff",
              padding: "20px",
              border: "1px solid #888",
              width: "80%",
              maxWidth: "500px",
              borderRadius: "10px",
              boxShadow: theme === 'dark' ? "0 4px 8px rgba(255, 255, 255, 0.2)" : "0 4px 8px rgba(0, 0, 0, 0.2)",
            }}
          >
            <span
              onClick={() => setShowChangeNameModal(false)}
              style={{
                color: "#aaa",
                float: "right",
                fontSize: "28px",
                fontWeight: "bold",
                cursor: "pointer",
              }}
            >
              &times;
            </span>
            <h3>Change Name</h3>
            <form onSubmit={e => e.preventDefault()}>
              <p>Enter New Name:</p>
              <input
                type="text"
                id="newName"
                placeholder="New Full Name"
                required
                style={{
                  width: "95%",
                  padding: "10px",
                  margin: "8px 0",
                  border: "1px solid #ccc",
                  borderRadius: "5px",
                }}
              />
              <p>Enter Verification Code:</p>
              <input
                type="text"
                id="nameChangeCode"
                placeholder="6-digit Code"
                required
                style={{
                  width: "95%",
                  padding: "10px",
                  margin: "8px 0",
                  border: "1px solid #ccc",
                  borderRadius: "5px",
                }}
              />
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center', margin: '10px 0' }}>
                <button
                  type="button"
                  onClick={sendNameChangeCode}
                  style={{
                    ...gradientButtonStyle,
                    padding: "10px 20px",
                    borderRadius: "5px",
                    fontWeight: "bold",
                    margin: 0
                  }}
                >
                  Send Verification Code
                </button>
                <button
                  type="button"
                  onClick={verifyAndUpdateName}
                  style={{
                    ...gradientButtonStyle,
                    padding: "10px 20px",
                    borderRadius: "5px",
                    fontWeight: "bold",
                    margin: 0
                  }}
                >
                  Verify and Update Name
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div
        style={{
          background: theme === 'dark' ? '#333' : "#fff",
          padding: "30px",
          borderRadius: "12px",
          maxWidth: "600px",
          margin: "30px auto",
          boxShadow: theme === 'dark' ? "0 8px 20px rgba(255,255,255,0.15)" : "0 8px 20px rgba(0,0,0,0.15)",
        }}
      >
        <h2 style={{ textAlign: "center" }}>Change Password</h2>
        <button
          onClick={() => setShowChangePasswordModal(true)}
          style={{
            ...gradientButtonStyle,
            display: "block",
            margin: "20px auto",
            padding: "10px 20px",
            borderRadius: "5px"
          }}
        >
          Update
        </button>
      </div>

      {showChangePasswordModal && (
        <div
          style={{
            position: "fixed",
            zIndex: 1000,
            left: 0,
            top: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          onClick={(e) => e.target === e.currentTarget && setShowChangePasswordModal(false)}
        >
          <div
            style={{
              backgroundColor: theme === 'dark' ? '#333' : "#fff",
              padding: "20px",
              border: "1px solid #888",
              width: "80%",
              maxWidth: "500px",
              borderRadius: "10px",
              boxShadow: theme === 'dark' ? "0 4px 8px rgba(255, 255, 255, 0.2)" : "0 4px 8px rgba(0, 0, 0, 0.2)",
            }}
          >
            <span
              onClick={() => setShowChangePasswordModal(false)}
              style={{
                color: "#aaa",
                float: "right",
                fontSize: "28px",
                fontWeight: "bold",
                cursor: "pointer",
              }}
            >
              &times;
            </span>
            <h3>Change Password</h3>
            <form onSubmit={e => e.preventDefault()}>
              <p>Enter Old Password:</p>
              <div style={{ position: 'relative' }}>
                <input
                  type={oldPasswordVisible ? "text" : "password"}
                  value={oldPassword}
                  onChange={e => setOldPassword(e.target.value)}
                  placeholder="Old Password"
                  required
                  style={{ width: "100%", padding: "10px", margin: "8px 0", border: "1px solid #ccc", borderRadius: "5px" }}
                />
                <button
                  type="button"
                  onClick={() => setOldPasswordVisible(v => !v)}
                  style={{
                    position: "absolute",
                    right: 10,
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    fontSize: "16px",
                    cursor: "pointer",
                    color: "#1976d2"
                  }}
                  tabIndex={-1}
                  aria-label={oldPasswordVisible ? "Hide password" : "Show password"}
                >
                  {oldPasswordVisible ? "Hide" : "Show"}
                </button>
              </div>
              <p>Enter New Password:</p>
              <div style={{ position: 'relative' }}>
                <input
                  type={newPasswordVisible ? "text" : "password"}
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="New Password"
                  required
                  style={{ width: "100%", padding: "10px", margin: "8px 0", border: "1px solid #ccc", borderRadius: "5px" }}
                />
                <button
                  type="button"
                  onClick={() => setNewPasswordVisible(v => !v)}
                  style={{
                    position: "absolute",
                    right: 10,
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    fontSize: "16px",
                    cursor: "pointer",
                    color: "#1976d2"
                  }}
                  tabIndex={-1}
                  aria-label={newPasswordVisible ? "Hide password" : "Show password"}
                >
                  {newPasswordVisible ? "Hide" : "Show"}
                </button>
              </div>
              <p>Confirm New Password:</p>
              <div style={{ position: 'relative' }}>
                <input
                  type={confirmNewPasswordVisible ? "text" : "password"}
                  value={confirmNewPassword}
                  onChange={e => setConfirmNewPassword(e.target.value)}
                  placeholder="Confirm New Password"
                  required
                  style={{ width: "100%", padding: "10px", margin: "8px 0", border: "1px solid #ccc", borderRadius: "5px" }}
                />
                <button
                  type="button"
                  onClick={() => setConfirmNewPasswordVisible(v => !v)}
                  style={{
                    position: "absolute",
                    right: 10,
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    fontSize: "16px",
                    cursor: "pointer",
                    color: "#1976d2"
                  }}
                  tabIndex={-1}
                  aria-label={confirmNewPasswordVisible ? "Hide password" : "Show password"}
                >
                  {confirmNewPasswordVisible ? "Hide" : "Show"}
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, margin: '4px 0' }}>
                <div style={{ display: 'flex', flexDirection: 'row', gap: 6 }}>
                  <input
                    type="text"
                    value={passwordCode}
                    onChange={e => setPasswordCode(e.target.value)}
                    placeholder="6-digit Code"
                    style={{ flex: 1, padding: "7px 8px", fontSize: 15, border: "1px solid #ccc", borderRadius: "5px", minWidth: 0, maxWidth: 120 }}
                    disabled={changePasswordStep === 1}
                  />
                  <button
                    type="button"
                    onClick={sendPasswordChangeCode}
                    style={{ ...gradientButtonStyle, padding: "8px 0", fontSize: 15, borderRadius: "5px", minWidth: 90, width: '95%', maxWidth: 150, margin: 0 }}
                    disabled={changePasswordLoading || !oldPassword || !newPassword || !confirmNewPassword || newPassword !== confirmNewPassword}
                  >
                    {changePasswordLoading ? "Sending..." : "Send Code"}
                  </button>
                </div>
                <button
  type="button"
  onClick={verifyAndChangePassword}
  style={{
    ...gradientButtonStyle,
    padding: "10px 0",
    fontSize: 16,
    borderRadius: "5px",
    width: '100%',
    marginTop: 4,
    maxWidth: 180,
    margin: "16px auto 0 auto" // <-- Add this line to center the button
  }}
  disabled={changePasswordLoading || !passwordCode}
>
  {changePasswordLoading ? "Updating..." : "Update Password"}
</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div
        style={{
          background: theme === 'dark' ? '#333' : "#fff",
          padding: "30px",
          borderRadius: "12px",
          maxWidth: "600px",
          margin: "30px auto",
          boxShadow: theme === 'dark' ? "0 8px 20px rgba(255,255,255,0.15)" : "0 8px 20px rgba(0,0,0,0.15)",
        }}
      >
        <h2 style={{ textAlign: "center" }}>Funding Password</h2>
        <button
          onClick={() => setShowFundingPasswordModal(true)}
          style={{
            ...gradientButtonStyle,
            display: "block",
            margin: "20px auto",
            padding: "10px 20px",
            borderRadius: "5px"
          }}
        >
          Update
        </button>
      </div>

      {showFundingPasswordModal && (
        <div
          style={{
            position: "fixed",
            zIndex: 1000,
            left: 0,
            top: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          onClick={(e) => e.target === e.currentTarget && setShowFundingPasswordModal(false)}
        >
          <div
            style={{
              backgroundColor: theme === 'dark' ? '#333' : "#fff",
              padding: "20px",
              border: "1px solid #888",
              width: "80%",
              maxWidth: "500px",
              borderRadius: "10px",
              boxShadow: theme === 'dark' ? "0 4px 8px rgba(255, 255, 255, 0.2)" : "0 4px 8px rgba(0, 0, 0, 0.2)",
            }}
          >
            <span
              onClick={() => setShowFundingPasswordModal(false)}
              style={{
                color: "#aaa",
                float: "right",
                fontSize: "28px",
                fontWeight: "bold",
                cursor: "pointer",
              }}
            >
              &times;
            </span>
            <h3>Change Funding Password</h3>
            <form onSubmit={e => e.preventDefault()}>
              <p>Enter New Funding Password:</p>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", position: 'relative' }}>
                <input
                  type={fundingPasswordVisible ? "text" : "password"}
                  id="newFundingPassword"
                  placeholder="New Funding Password"
                  required
                  maxLength="8"
                  style={{
                    flex: 1,
                    padding: "10px",
                    border: "1px solid #ccc",
                    borderRadius: "5px",
                  }}
                />
                <button
                  type="button"
                  onClick={() => setFundingPasswordVisible(v => !v)}
                  style={{
                    position: "absolute",
                    right: 10,
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    fontSize: "16px",
                    cursor: "pointer",
                    color: "#1976d2"
                  }}
                  tabIndex={-1}
                  aria-label={fundingPasswordVisible ? "Hide password" : "Show password"}
                >
                  {fundingPasswordVisible ? "Hide" : "Show"}
                </button>
              </div>
              <p>Enter Verification Code:</p>
              <input
                type="text"
                id="verificationCode"
                placeholder="5-digit Code"
                required
                style={{
                  width: "95%",
                  padding: "10px",
                  margin: "8px 0",
                  border: "1px solid #ccc",
                  borderRadius: "5px",
                }}
              />
              <p>Enter Authenticator Code:</p>
              <input
                type="text"
                value={fundingAuthenticatorCode}
                onChange={e => setFundingAuthenticatorCode(e.target.value)}
                placeholder="6-digit Authenticator Code"
                maxLength={6}
                required
                style={{
                  width: "95%",
                  padding: "10px",
                  margin: "8px 0",
                  border: "1px solid #ccc",
                  borderRadius: "5px",
                }}
              />
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center', margin: '10px 0' }}>
                <button
                  type="button"
                  onClick={sendFundingCode}
                  style={{
                    ...gradientButtonStyle,
                    padding: "10px 20px",
                    borderRadius: "5px",
                    fontWeight: "bold",
                    margin: 0
                  }}
                >
                  Send Code
                </button>
                <button
                  type="button"
                  onClick={verifyAndUpdateFundingPassword}
                  style={{
                    ...gradientButtonStyle,
                    padding: "10px 20px",
                    borderRadius: "5px",
                    fontWeight: "bold",
                    margin: 0
                  }}
                >
                  Verify and Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div
        style={{
          background: theme === 'dark' ? '#333' : "#fff",
          padding: "30px",
          borderRadius: "12px",
          maxWidth: "600px",
          margin: "30px auto",
          boxShadow: theme === 'dark' ? "0 8px 20px rgba(255,255,255,0.15)" : "0 8px 20px rgba(0,0,0,0.15)",
        }}
      >
        <h2 style={{ textAlign: "center" }}>Funds Security</h2>
        <button
          onClick={() => handleFundsLockClick(fundsLocked ? "enable" : "disable")}
          style={{
            ...gradientButtonStyle,
            display: "block",
            margin: "20px auto",
            padding: "10px 8px",
            borderRadius: "5px",
            fontWeight: "bold",
            fontSize: "12px"
          }}
        >
          {fundsLocked ? "Enable Funds" : "Disable Funds"}
        </button>
      </div>

      {showFundsLockModal && (
        <div
          style={{
            position: "fixed",
            zIndex: 1000,
            left: 0,
            top: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0, 0, 0, 0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          onClick={(e) => e.target === e.currentTarget && setShowFundsLockModal(false)}
        >
          <div
            style={{
              backgroundColor: theme === 'dark' ? '#333' : "#fff",
              padding: "24px",
              border: "1px solid #888",
              width: "90%",
              maxWidth: "400px",
              borderRadius: "10px",
              boxShadow: theme === 'dark'
                ? "0 4px 8px rgba(255, 255, 255, 0.2)"
                : "0 4px 8px rgba(0, 0, 0, 0.2)",
              textAlign: "center",
            }}
          >
            <span
              onClick={() => setShowFundsLockModal(false)}
              style={{
                color: "#aaa",
                float: "right",
                fontSize: "28px",
                fontWeight: "bold",
                cursor: "pointer",
              }}
            >
              &times;
            </span>
            <h3>{lockAction === "disable" ? "Disable" : "Enable"} Funds Activities</h3>
            <form onSubmit={e => {
              e.preventDefault();
              handleFundsLockVerify();
            }}>
              <p>Enter your 7-digit SPOTID:</p>
              <input
                type="text"
                value={lockSpotId}
                onChange={e => setLockSpotId(e.target.value)}
                placeholder="SPOTID"
                maxLength={7}
                style={{
                  width: "95%",
                  padding: "10px",
                  margin: "8px 0",
                  border: "1px solid #ccc",
                  borderRadius: "5px",
                  textAlign: "center"
                }}
                required
              />
              {/* Authenticator code required for disabling funds */}
              {lockAction === "disable" && (
                <>
                  <p>Enter Authenticator Code:</p>
                  <input
                    type="text"
                    value={lockAuthenticatorCode}
                    onChange={e => setLockAuthenticatorCode(e.target.value)}
                    placeholder="6-digit Authenticator Code"
                    maxLength={6}
                    style={{
                      width: "95%",
                      padding: "10px",
                      margin: "8px 0",
                      border: "1px solid #ccc",
                      borderRadius: "5px",
                      textAlign: "center"
                    }}
                    required
                  />
                </>
              )}
              {/* Face capture required for enabling funds */}
              {lockAction === "enable" && (
                <div style={{ display: "flex", gap: 12, justifyContent: "center", margin: "10px 0" }}>
                  <button
                    type="button"
                    onClick={() => setShowLockFaceModal(true)}
                    style={{
                      ...gradientButtonStyle,
                      padding: "10px 20px",
                      borderRadius: "5px",
                      fontWeight: "bold",
                      margin: 0
                    }}
                  >
                    {lockFaceImg ? "Retake Face Image" : "Capture Face"}
                  </button>
                </div>
              )}
              <button
                type="submit"
                style={{
                  ...gradientButtonStyle,
                  padding: "10px 20px",
                  borderRadius: "5px",
                  fontWeight: "bold",
                  margin: 0,
                  width: '100%',
                  marginTop: 10
                }}
              >
                {lockAction === "disable" ? "Disable Funds" : "Enable Funds"}
              </button>
              {lockAction === "enable" && lockFaceImg && (
                <div style={{ margin: "10px 0" }}>
                  <img src={lockFaceImg} alt="face" width={80} height={60} style={{ borderRadius: 8, border: "1px solid #ccc" }} />
                </div>
              )}
            </form>
          </div>
          {showLockFaceModal && (
            <FaceCapture
              visible={showLockFaceModal}
              onCapture={handleLockFaceCapture}
              onClose={handleLockFaceModalClose}
              instruction="Align your face in the circle and capture"
            />
          )}
        </div>
      )}

      <div
        style={{
          background: theme === 'dark' ? '#333' : "#fff",
          padding: "30px",
          borderRadius: "12px",
          maxWidth: "600px",
          margin: "30px auto",
          boxShadow: theme === 'dark' ? "0 8px 20px rgba(255,255,255,0.15)" : "0 8px 20px rgba(0,0,0,0.15)",
        }}
      >
        <h2 style={{ textAlign: "center" }}>Change Theme</h2>
        <button
          onClick={toggleTheme}
          style={{
            ...gradientButtonStyle,
            display: "block",
            margin: "20px auto",
            padding: "10px 10px",
            borderRadius: "5px",
            fontWeight: "bold",
            fontSize: "14px"
          }}
        >
          {theme === 'dark' ? 'Light' : 'Dark'} Theme
        </button>
      </div>

      <div
        style={{
          background: theme === 'dark' ? '#333' : "#fff",
          padding: "30px",
          borderRadius: "12px",
          maxWidth: "600px",
          margin: "30px auto",
          boxShadow: theme === 'dark' ? "0 8px 20px rgba(255,255,255,0.15)" : "0 8px 20px rgba(0,0,0,0.15)",
        }}
      >
        <h2 style={{ textAlign: "center" }}>App Access</h2>
        {isApp() ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%' }}>
            <button
              onClick={handleVisitWebsite}
              style={{
                padding: "10px 20px",
                background: "linear-gradient(90deg, #00bfff, #0056b3)",
                color: "#fff",
                border: "none",
                borderRadius: "6px",
                fontWeight: "bold",
                cursor: "pointer",
                transition: "background 0.3s, transform 0.2s",
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
                maxWidth: "200px",
                margin: "16px auto",
                display: "block",
              }}
            >
              Visit Website
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%' }}>
            <button
              onClick={() => setShowDownloadModal(true)}
              style={{
                padding: "10px 10px",
                background: "linear-gradient(90deg, #00bfff, #0056b3)",
                color: "#fff",
                border: "none",
                borderRadius: "6px",
                fontWeight: "bold",
                cursor: "pointer",
                transition: "background 0.3s, transform 0.2s",
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
                width: "90%",
                maxWidth: "115px",
                margin: "16px 0",
                display: 'block',
              }}
            >
              Download App
            </button>
          </div>
        )}
        {showDownloadModal && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              width: "100vw",
              height: "100vh",
              background: "rgba(0,0,0,0.35)",
              zIndex: 20000,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            onClick={() => setShowDownloadModal(false)}
          >
            <div
              style={{
                background: "#fff",
                borderRadius: 14,
                padding: 28,
                minWidth: 260,
                maxWidth: "90vw",
                boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                position: "relative",
              }}
              onClick={e => e.stopPropagation()}
            >
              <button
                onClick={() => setShowDownloadModal(false)}
                style={{
                  position: "absolute",
                  top: 10,
                  right: 14,
                  background: "none",
                  border: "none",
                  fontSize: 22,
                  color: "#888",
                  cursor: "pointer",
                }}
                aria-label="Close"
              >
                &times;
              </button>
              <div style={{ fontWeight: 700, fontSize: 20, color: "#003366", marginBottom: 18 }}>
                Download TradeSpot App
              </div>
              <button
                onClick={handlePlaystore}
                style={{
                  width: "100%",
                  maxWidth: 260,
                  margin: "8px 0",
                  padding: "10px 0",
                  background: "#34a853",
                  color: "#fff",
                  border: "none",
                  borderRadius: 6,
                  fontWeight: 600,
                  fontSize: 16,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                }}
              >
                <span style={{ fontSize: 20, marginRight: 8 }}>▶️</span> Download on Playstore
              </button>
              <button
                onClick={handleAPK}
                style={{
                  width: "100%",
                  maxWidth: 260,
                  margin: "8px 0",
                  padding: "10px 0",
                  background: "#4285f4",
                  color: "#fff",
                  border: "none",
                  borderRadius: 6,
                  fontWeight: 600,
                  fontSize: 16,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                }}
              >
                <span style={{ fontSize: 20, marginRight: 8 }}>⬇️</span> Download APK Version
              </button>
              <button
                onClick={() => window.open("https://stalwart-torrone-a5d82a.netlify.app/tsauth.apk", "_blank")}
                style={{
                  width: "100%",
                  maxWidth: 260,
                  margin: "8px 0",
                  padding: "10px 0",
                  background: "#00b894",
                  color: "#fff",
                  border: "none",
                  borderRadius: 6,
                  fontWeight: 600,
                  fontSize: 16,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                }}
              >
                <span style={{ fontSize: 20, marginRight: 8 }}>🔒</span> Download Authenticator
              </button>
            </div>
          </div>
        )}
      </div>

      <div
        style={{
          background: theme === 'dark' ? '#333' : "#fff",
          padding: "30px",
          borderRadius: "12px",
          maxWidth: "600px",
          margin: "30px auto",
          boxShadow: theme === 'dark' ? "0 8px 20px rgba(255,255,255,0.15)" : "0 8px 20px rgba(0,0,0,0.15)",
        }}
      >
        <h2 style={{ textAlign: "center" }}>Math Calculator</h2>
        <button
          onClick={() => setShowCalculator(true)}
          style={{
            ...gradientButtonStyle,
            display: "block",
            margin: "20px auto",
            padding: "10px 20px",
            borderRadius: "5px"
          }}
        >
          Calculator
        </button>
      </div>

      <div
        style={{
          background: theme === 'dark' ? '#333' : "#fff",
          padding: "30px",
          borderRadius: "12px",
          maxWidth: "600px",
          margin: "30px auto",
          boxShadow: theme === 'dark' ? "0 8px 20px rgba(255,255,255,0.15)" : "0 8px 20px rgba(0,0,0,0.15)",
        }}
      >
        <h2 style={{ textAlign: "center" }}>Chatbot Assistant</h2>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <button
            onClick={() => setShowBot(v => !v)}
            style={{
              ...gradientButtonStyle,
              minWidth: 115,
              fontSize: 13,
              fontWeight: 550,
              background: showBot ? 'linear-gradient(90deg, #00bfff, #0056b3)' : 'linear-gradient(90deg, #00bfff, #0056b3)',
              margin: '15px auto',
              display: 'block',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
              transition: 'background 0.3s',
            }}
          >
            {showBot ? 'Hide Chatbot' : 'Show Chatbot'}
          </button>
        </div>
      </div>

      {/* 2FA Section UI */}
      <div style={{
        background: theme === 'dark' ? '#333' : '#fff',
        padding: '33px',
        borderRadius: '12px',
        maxWidth: '600px',
        margin: '30px auto',
        boxShadow: theme === 'dark' ? '0 8px 20px rgba(255,255,255,0.15)' : '0 8px 20px rgba(0,0,0,0.15)',
      }}>
        <h2 style={{ textAlign: 'center' }}>TS Authentication</h2>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%' }}>
          {twoFactorEnabled ? (
            <button style={{ background: '#e6f7ff', color: '#00bfff', border: '1px solid #00bfff', borderRadius: 6, padding: '8px 18px', fontWeight: 600, cursor: 'not-allowed', margin: '12px 0' }} disabled>
              TSauth verified
            </button>
          ) : (
            <button style={{ ...gradientButtonStyle, margin: 15 }} onClick={() => setShow2FAModal(true)}>
              Enable 2FA
            </button>
          )}
        </div>
      </div>

      {show2FAModal && (
        <div
          style={{
            display: 'block',
            position: 'fixed',
            zIndex: 2000,
            left: 0,
            top: 0,
            width: '100%',
            height: '100%',
            overflow: 'auto',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
          }}
          onClick={e => e.target === e.currentTarget && setShow2FAModal(false)}
        >
          <div
            style={{
              background: theme === 'dark' ? '#333' : '#fff',
              margin: '6% auto',
              padding: '24px 18px 18px 18px',
              border: '1px solid #888',
              width: '95%',
              maxWidth: '400px',
              borderRadius: '10px',
              boxShadow: theme === 'dark' ? '0 4px 8px rgba(255, 255, 255, 0.2)' : '0 4px 8px rgba(0, 0, 0, 0.2)',
              position: 'relative',
            }}
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setShow2FAModal(false)}
              style={{
                position: 'absolute',
                top: 10,
                right: 14,
                background: 'none',
                border: 'none',
                fontSize: 22,
                color: '#888',
                cursor: 'pointer',
              }}
              aria-label='Close'
            >
              &times;
            </button>
            <div style={{
              background: theme === 'dark' ? '#222' : '#fafdff',
              borderRadius: 12,
              boxShadow: '0 8px 32px rgba(0,0,0,0.10)',
              padding: 0,
              margin: 0,
            }}>
              <TwoFactorAuthSetup userEmail={userEmail} onVerified={secret => {}} showCopyButton onSuccess={() => {
                setAuthSuccess(true);
                setTimeout(() => {
                  setAuthSuccess(false);
                  window.location.reload();
                }, 3000);
              }} />
            </div>
          </div>
        </div>
      )}

      {showCalculator && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{
            background: theme === 'dark' ? '#1a2233' : '#fff',
            borderRadius: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
            padding: 24, minWidth: 320, maxWidth: '90vw',
          }}>
            <div style={{ marginBottom: 12, fontWeight: 'bold', fontSize: 20, color: theme === 'dark' ? '#fff' : '#0056b3' }}>
              Calculator
            </div>
            <input
              style={{
                width: '100%', fontSize: 22, padding: 10, marginBottom: 16,
                border: '1px solid #00bfff', borderRadius: 8, textAlign: 'right', background: theme === 'dark' ? '#222b3a' : '#f7fafd', color: theme === 'dark' ? '#fff' : '#222'
              }}
              value={calcValue}
              readOnly
            />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 60px)', gap: 10, justifyContent: 'center' }}>
              {["7","8","9","/", "4","5","6","*", "1","2","3","-", "0",".","=","+"].map((val) => (
                <button
                  key={val}
                  style={{
                    padding: '16px 0', fontSize: 20, border: 'none', borderRadius: 8,
                    background: 'linear-gradient(90deg, #00bfff, #0056b3)', color: '#fff', fontWeight: 'bold', cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.10)', transition: 'background 0.2s',
                  }}
                  onClick={() => handleCalcClick(val)}
                >
                  {val}
                </button>
              ))}
              <button
                style={{
                  gridColumn: 'span 2', marginTop: 8, padding: '12px 0', fontSize: 18, border: 'none', borderRadius: 8,
                  background: '#f0ad4e', color: '#fff', fontWeight: 'bold', cursor: 'pointer',
                }}
                onClick={() => handleCalcClick('C')}
              >
                Clear
              </button>
              <button
                style={{
                  gridColumn: 'span 2', marginTop: 8, padding: '12px 0', fontSize: 18, border: 'none', borderRadius: 8,
                  background: '#888', color: '#fff', fontWeight: 'bold', cursor: 'pointer',
                }}
                onClick={() => handleCalcClick('DEL')}
              >
                Delete
              </button>
              <button
                style={{
                  gridColumn: 'span 4', marginTop: 8, padding: '12px 0', fontSize: 18, border: 'none', borderRadius: 8,
                  background: '#ff4d4f', color: '#fff', fontWeight: 'bold', cursor: 'pointer',
                }}
                onClick={() => setShowCalculator(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;