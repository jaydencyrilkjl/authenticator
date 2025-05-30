import React, { useState, useEffect } from 'react';
import { TOTP } from 'totp-generator';
import { Preferences } from '@capacitor/preferences';
import AuthenticatorLogin from '../AuthenticatorLogin';

const STORAGE_KEY = 'tradespot_secret_key';

function pad(num) {
  return num.toString().padStart(2, '0');
}

const TradeSpotAuthenticator = () => {
  const [secret, setSecret] = useState('');
  const [code, setCode] = useState('');
  const [timeLeft, setTimeLeft] = useState(60);
  const [inputSecret, setInputSecret] = useState('');
  const [editing, setEditing] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loggedIn, setLoggedIn] = useState(!!localStorage.getItem('authToken'));
  const [copySuccess, setCopySuccess] = useState('');

  // Helper to sanitize base32 secret
  function sanitizeBase32(secret) {
    return (secret || '').replace(/[^A-Z2-7]/gi, '').toUpperCase();
  }

  useEffect(() => {
    if (!loggedIn) return;
    // Check 2FA status and get main secret from server
    async function fetch2FAStatus() {
      setLoading(true);
      try {
        const userId = localStorage.getItem('userId');
        if (!userId) {
          setLoading(false);
          return;
        }
        const res = await fetch(`https://tradespots.online/api/auth/user/${userId}`);
        const data = await res.json();
        if (data && data.user && data.user.twoFactorEnabled && data.user.twoFactorSecret) {
          setIsVerified(true);
          setSecret(sanitizeBase32(data.user.twoFactorSecret));
          setEditing(false);
        } else {
          // Not verified, load from local storage
          Preferences.get({ key: STORAGE_KEY }).then(({ value }) => {
            if (value) setSecret(sanitizeBase32(value));
          });
        }
      } catch (e) {
        // fallback to local
        Preferences.get({ key: STORAGE_KEY }).then(({ value }) => {
          if (value) setSecret(sanitizeBase32(value));
        });
      }
      setLoading(false);
    }
    fetch2FAStatus();
  }, [loggedIn]);

  useEffect(() => {
    if (!secret) return;
    // Update code every second using browser-compatible TOTP
    const interval = setInterval(() => {
      const epoch = Math.floor(Date.now() / 1000);
      setTimeLeft(60 - (epoch % 60));
      setCode(secret ? TOTP.generate(secret, { digits: 6, period: 60 }).otp : '');
    }, 1000);
    return () => clearInterval(interval);
  }, [secret]);

  const handleSaveSecret = async () => {
    const sanitized = sanitizeBase32(inputSecret);
    await Preferences.set({ key: STORAGE_KEY, value: sanitized });
    setSecret(sanitized);
    setEditing(false);
  };

  const handleEdit = () => {
    setInputSecret(secret);
    setEditing(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userId');
    setLoggedIn(false);
  };

  const handleCopyCode = () => {
    if (code) {
      navigator.clipboard.writeText(code);
      setCopySuccess('Copied!');
      setTimeout(() => setCopySuccess(''), 1500);
    }
  };

  const handlePasteCode = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setInputSecret(text.trim());
    } catch (e) {
      setCopySuccess('Paste failed');
      setTimeout(() => setCopySuccess(''), 1500);
    }
  };

  useEffect(() => {
    // Auto-refresh if 2FA setup was just completed
    if (localStorage.getItem('tsauth_2fa_success') === '1') {
      localStorage.removeItem('tsauth_2fa_success');
      window.location.reload();
    }
  }, []);

  if (!loggedIn) {
    return <AuthenticatorLogin onLogin={() => setLoggedIn(true)} />;
  }

  if (loading) {
    return <div style={{ textAlign: 'center', marginTop: 40 }}>Loading...</div>;
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'transparent',
      zIndex: 1000,
    }}>
      {/* Paste code button at top left of screen (always visible when editing) */}
      {editing && (
        <button
          onClick={handlePasteCode}
          style={{
            position: 'fixed',
            top: 24,
            left: 24,
            background: '#fff',
            color: '#0056b3',
            border: '1px solid #00bfff',
            borderRadius: 6,
            padding: '6px 16px',
            fontWeight: 600,
            fontSize: 15,
            cursor: 'pointer',
            boxShadow: '0 1px 4px rgba(0,191,255,0.06)',
            transition: 'background 0.2s',
            zIndex: 2002
          }}
        >Paste Code</button>
      )}
      {/* Copy code button at top left of screen (only when not editing) */}
      {secret && !editing && (
        <button
          onClick={handleCopyCode}
          style={{
            position: 'fixed',
            top: 24,
            left: 24,
            background: '#fff',
            color: '#0056b3',
            border: '1px solid #00bfff',
            borderRadius: 6,
            padding: '6px 16px',
            fontWeight: 600,
            fontSize: 15,
            cursor: 'pointer',
            boxShadow: '0 1px 4px rgba(0,191,255,0.06)',
            transition: 'background 0.2s',
            zIndex: 2001
          }}
        >Copy Code</button>
      )}
      {/* Copy success message */}
      {copySuccess && (
        <div style={{
          position: 'fixed',
          top: 24,
          left: 140,
          color: '#00b894',
          fontWeight: 600,
          fontSize: 15,
          background: '#e6fff3',
          borderRadius: 6,
          padding: '4px 10px',
          zIndex: 2002
        }}>{copySuccess}</div>
      )}
      {/* Logout button at top right of screen */}
      {loggedIn && (
        <button
          onClick={handleLogout}
          style={{
            position: 'fixed',
            top: 24,
            right: 24,
            background: '#fff',
            color: '#0056b3',
            border: '1px solid #00bfff',
            borderRadius: 6,
            padding: '6px 16px',
            fontWeight: 600,
            fontSize: 15,
            cursor: 'pointer',
            boxShadow: '0 1px 4px rgba(0,191,255,0.06)',
            transition: 'background 0.2s',
            zIndex: 2001
          }}
        >Logout</button>
      )}
      <div style={{
        maxWidth: 380,
        width: '95vw',
        margin: 0,
        padding: '32px 18px 28px 18px',
        border: 'none',
        borderRadius: 18,
        background: 'linear-gradient(135deg, #fafdff 60%, #e6f7ff 100%)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.10)',
        textAlign: 'center',
        fontFamily: 'Segoe UI, sans-serif',
        position: 'relative',
        minHeight: 340,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
      }}>
        <h2 style={{ fontWeight: 700, color: '#0056b3', marginBottom: 18, fontSize: 26, letterSpacing: 1 }}>TradeSpot Authenticator</h2>
        {secret && !editing ? (
          <>
            <div style={{
              fontSize: 48,
              fontWeight: 'bold',
              letterSpacing: 6,
              margin: '24px 0 10px 0',
              background: 'linear-gradient(90deg, #00bfff 60%, #0056b3 100%)',
              color: '#fff',
              borderRadius: 12,
              boxShadow: '0 2px 12px rgba(0,0,0,0.10)',
              padding: '18px 0',
              userSelect: 'all',
              transition: 'background 0.2s',
            }}>{code || '------'}</div>
            <div style={{ marginBottom: 18, color: '#0056b3', fontWeight: 500, fontSize: 15 }}>
              Next code in: <b>{pad(timeLeft)}</b> sec
            </div>
            {isVerified ? (
              <button style={{
                background: '#e6f7ff',
                color: '#00bfff',
                border: '1px solid #00bfff',
                borderRadius: 8,
                padding: '10px 22px',
                fontWeight: 600,
                fontSize: 16,
                cursor: 'not-allowed',
                margin: '12px 0',
                boxShadow: '0 2px 8px rgba(0,191,255,0.08)',
                letterSpacing: 1
              }} disabled>TSauth verified</button>
            ) : (
              <button onClick={handleEdit} style={{
                background: 'linear-gradient(90deg, #00bfff 60%, #0056b3 100%)',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                padding: '10px 22px',
                fontWeight: 600,
                fontSize: 16,
                cursor: 'pointer',
                margin: '12px 0',
                boxShadow: '0 2px 8px rgba(0,191,255,0.08)',
                letterSpacing: 1,
                transition: 'background 0.2s',
              }}>Edit Secret</button>
            )}
          </>
        ) : (
          <div style={{ marginTop: 10 }}>
            <input
              type="text"
              placeholder="Enter secret key"
              value={inputSecret}
              onChange={e => setInputSecret(e.target.value)}
              style={{
                width: '92%',
                padding: '12px 10px',
                marginBottom: 14,
                border: '1.5px solid #00bfff',
                borderRadius: 8,
                fontSize: 17,
                outline: 'none',
                background: '#fafdff',
                color: '#0056b3',
                fontWeight: 500,
                letterSpacing: 1,
                boxShadow: '0 1px 4px rgba(0,191,255,0.06)'
              }}
              disabled={isVerified}
            />
            <br />
            <button
              onClick={handleSaveSecret}
              disabled={!inputSecret || isVerified}
              style={{
                background: (!inputSecret || isVerified) ? '#b3e0fc' : 'linear-gradient(90deg, #00bfff 60%, #0056b3 100%)',
                color: (!inputSecret || isVerified) ? '#fff' : '#fff',
                border: 'none',
                borderRadius: 8,
                padding: '10px 22px',
                fontWeight: 600,
                fontSize: 16,
                cursor: (!inputSecret || isVerified) ? 'not-allowed' : 'pointer',
                margin: '8px 0',
                boxShadow: '0 2px 8px rgba(0,191,255,0.08)',
                letterSpacing: 1,
                transition: 'background 0.2s',
              }}
            >Save Secret</button>
          </div>
        )}
        <div style={{ marginTop: 28, fontSize: 13, color: '#888', background: '#f2f8fc', borderRadius: 8, padding: '10px 0', fontWeight: 500 }}>
          This code is for use only within TradeSpot.
        </div>
      </div>
    </div>
  );
};

export default TradeSpotAuthenticator;
