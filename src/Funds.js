import React, { useState, useEffect, useContext } from "react";
import StyledAlert from "./components/StyledAlert";
import { ThemeContext } from "./App";

const FundsManagement = () => {
  const [depositModalVisible, setDepositModalVisible] = useState(false);
  const [withdrawalModalVisible, setWithdrawalModalVisible] = useState(false);
  const [transactionHistoryVisible, setTransactionHistoryVisible] = useState(false);
  const [notificationPanelVisible, setNotificationPanelVisible] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [transactionHistory, setTransactionHistory] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [depositAmount, setDepositAmount] = useState("");
  const [depositTxid, setDepositTxid] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawWalletAddress, setWithdrawWalletAddress] = useState("");
  const [withdrawFundingPassword, setWithdrawFundingPassword] = useState("");
  const [withdrawAuthenticatorCode, setWithdrawAuthenticatorCode] = useState(""); // NEW: 2FA code
  const [alertMessage, setAlertMessage] = useState("");
  const [alertCallback, setAlertCallback] = useState(null);
  const [transferModalVisible, setTransferModalVisible] = useState(false);
  const [transferAmount, setTransferAmount] = useState("");
  const [transferVerificationCode, setTransferVerificationCode] = useState("");
  const [transferFundingPassword, setTransferFundingPassword] = useState("");
  const [transferRecipientEmail, setTransferRecipientEmail] = useState("");
  const [showWithdrawFundingPassword, setShowWithdrawFundingPassword] = useState(false);
  const [showTransferFundingPassword, setShowTransferFundingPassword] = useState(false);
  const [fundsLocked, setFundsLocked] = useState(false);
  const [convertModalVisible, setConvertModalVisible] = useState(false);
  const [convertType, setConvertType] = useState('SPOT_TO_USDT');
  const [convertAmount, setConvertAmount] = useState('');
  const [convertResult, setConvertResult] = useState('');
  const [convertLoading, setConvertLoading] = useState(false);
  const [expectedConvertResult, setExpectedConvertResult] = useState('');
  const [userBalance, setUserBalance] = useState(null);
  const [userSpotBalance, setUserSpotBalance] = useState(null);

  const { theme } = useContext(ThemeContext);

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      setAlertMessage("User not logged in!");
      setAlertCallback(() => () => (window.location.href = "/login"));
      return;
    }

    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Fetch fundsLocked from backend
    const userId = localStorage.getItem("userId");
    if (!userId) return;
    fetch(`https://tradespots.online/api/funds/fundsLocked?userId=${userId}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) setFundsLocked(data.fundsLocked);
      });
  }, []);

  useEffect(() => {
    // Fetch user balances for convert modal and display
    const fetchBalances = async () => {
      const userId = localStorage.getItem('userId');
      if (!userId) return;
      try {
        const res = await fetch(`https://tradespots.online/api/auth/user/${userId}`);
        if (!res.ok) return;
        const data = await res.json();
        if (data && data.user) {
          setUserBalance(typeof data.user.balance === 'number' ? data.user.balance : 0);
          setUserSpotBalance(typeof data.user.spotBalance === 'number' ? data.user.spotBalance : 0);
        }
      } catch {}
    };
    fetchBalances();
  }, []);

  useEffect(() => {
    setExpectedConvertResult(getExpectedConvertResult(convertAmount, convertType));
  }, [convertAmount, convertType]);

  const fetchUnreadCount = async () => {
    const userId = localStorage.getItem("userId");
    if (!userId) return;

    try {
      const response = await fetch(
        `https://tradespots.online/api/funds/notifications/unread?userId=${userId}&limit=1000`
      );

      if (!response.ok) {
        if (response.status === 401) {
          setAlertMessage("Session expired. Please log in again.");
          setAlertCallback(() => () => {
            localStorage.removeItem("authToken");
            window.location.href = "/login";
          });
          return;
        } else {
          throw new Error("Failed to fetch unread notifications count");
        }
      }

      const data = await response.json();
      const count = data.notifications ? data.notifications.length : 0;
      setUnreadCount(count);
    } catch (error) {
      console.error("Error fetching unread notifications count:", error);
    }
  };

  const fetchTransactionHistory = async () => {
    const userId = localStorage.getItem("userId");
    if (!userId) return;

    try {
      const response = await fetch(
        `https://tradespots.online/api/funds/transactions?userId=${userId}`
      );

      if (!response.ok) {
        if (response.status === 401) {
          setAlertMessage("Session expired. Please log in again.");
          setAlertCallback(() => () => {
            localStorage.removeItem("authToken");
            window.location.href = "/login";
          });
          return;
        } else {
          throw new Error("Failed to fetch transaction history");
        }
      }

      const data = await response.json();
      if (data.success) {
        setTransactionHistory(data.transactions);
      }
    } catch (error) {
      console.error("Error fetching transaction history:", error);
    }
  };

  const fetchNotifications = async () => {
    const userId = localStorage.getItem("userId");
    if (!userId) return;
    try {
      const response = await fetch(
        `https://tradespots.online/api/funds/notifications?userId=${userId}`
      );
      const data = await response.json();
      if (data.success) {
        setNotifications(data.notifications);
        data.notifications.forEach((n) => {
          if (n.status === "unread") {
            markNotificationAsRead(n._id);
          }
        });
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  const markNotificationAsRead = async (notificationId) => {
    try {
      await fetch("https://tradespots.online/api/funds/notifications/markAsRead", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId }),
      });
      fetchUnreadCount();
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const copyAddress = (addressId) => {
    const addr = document.getElementById(addressId).innerText;
    navigator.clipboard.writeText(addr).then(() => {
      setAlertMessage("Address copied!");
    });
  };

  const submitDeposit = async () => {
    const userId = localStorage.getItem("userId");
    if (!userId) {
      setAlertMessage("Please log in.");
      return;
    }
    if (!depositAmount || depositAmount < 10) {
      setAlertMessage("Minimum deposit is 10 USDT.");
      return;
    }
    if (!depositTxid) {
      setAlertMessage("Please enter transaction ID.");
      return;
    }
    try {
      const response = await fetch("https://tradespots.online/api/funds/deposit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, amount: depositAmount, txid: depositTxid }),
      });
      const result = await response.json();
      if (result.success) {
        setAlertMessage("Deposit submitted successfully!");
        setDepositModalVisible(false); // Close modal immediately
        setDepositAmount("");
        setDepositTxid("");
        fetchTransactionHistory(); // Refresh history
      } else {
        setAlertMessage("Error: " + result.error);
      }
    } catch (error) {
      setAlertMessage("Deposit failed: " + error.message);
    }
  };

  const submitWithdrawal = async () => {
    setAlertMessage("");
    try {
      const userId = localStorage.getItem("userId");
      if (!userId) throw new Error("User not logged in");
      if (!withdrawAmount || !withdrawWalletAddress || !withdrawFundingPassword || !withdrawAuthenticatorCode) {
        setAlertMessage("All withdrawal fields are required, including authenticator code.");
        return;
      }
      const res = await fetch("https://tradespots.online/api/funds/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          amount: withdrawAmount,
          walletAddress: withdrawWalletAddress,
          fundingPassword: withdrawFundingPassword,
          authenticatorCode: withdrawAuthenticatorCode
        })
      });
      const data = await res.json();
      if (data.success) {
        setAlertMessage("Withdrawal request submitted successfully!");
        setWithdrawalModalVisible(false);
        setWithdrawAmount("");
        setWithdrawWalletAddress("");
        setWithdrawFundingPassword("");
        setWithdrawAuthenticatorCode("");
        fetchTransactionHistory();
      } else {
        setAlertMessage(data.error || "Withdrawal failed");
      }
    } catch (err) {
      setAlertMessage(err.message || "Withdrawal failed");
    }
  };

  const sendTransferVerificationCode = async () => {
    const userId = localStorage.getItem("userId");
    if (!userId) {
      setAlertMessage("Please log in.");
      return;
    }
    try {
      const response = await fetch("https://tradespots.online/api/funds/transferSendCode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error: ${errorText}`);
      }

      const result = await response.json();
      if (result.success) {
        setAlertMessage("Verification code sent to your email.");
      } else {
        setAlertMessage("Error: " + result.error);
      }
    } catch (error) {
      console.error("Error sending verification code:", error.message);
      setAlertMessage("Error sending verification code: " + error.message);
    }
  };

  const submitTransfer = async () => {
    const userId = localStorage.getItem("userId");
    if (!userId) {
      setAlertMessage("Please log in.");
      return;
    }
    if (!transferVerificationCode) {
      setAlertMessage("Please enter the verification code.");
      return;
    }
    if (!transferFundingPassword) {
      setAlertMessage("Please enter your funding password.");
      return;
    }
    if (!transferRecipientEmail) {
      setAlertMessage("Please enter the recipient's email.");
      return;
    }
    try {
      const response = await fetch("https://tradespots.online/api/funds/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          amount: transferAmount,
          transferVerificationCode, // <-- FIXED: was 'verificationCode'
          fundingPassword: transferFundingPassword,
          recipientEmail: transferRecipientEmail,
        }),
      });
      const result = await response.json();
      if (result.success) {
        setAlertMessage("Transfer successful!");
        setTransferModalVisible(false); // Close modal immediately
        setTransferAmount("");
        setTransferVerificationCode("");
        setTransferFundingPassword("");
        setTransferRecipientEmail("");
        fetchTransactionHistory(); // Refresh history
      } else {
        setAlertMessage("Transfer failed: " + result.error);
      }
    } catch (error) {
      setAlertMessage("Transfer failed: " + error.message);
    }
  };

  const deleteTransaction = async (transactionId) => {
    try {
      const response = await fetch(
        `https://tradespots.online/api/funds/transactions/${transactionId}`,
        { method: "DELETE" }
      );
      const result = await response.json();
      if (result.success) {
        setAlertMessage("Transaction deleted successfully");
        setTransactionHistory((prev) => prev.filter(tx => tx._id !== transactionId)); // Remove from UI
      } else {
        setAlertMessage("Error: " + result.error);
      }
    } catch (error) {
      setAlertMessage("Deletion failed: " + error.message);
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      const response = await fetch(
        `https://tradespots.online/api/funds/notifications/${notificationId}`,
        { method: "DELETE" }
      );
      const result = await response.json();
      if (result.success) {
        setAlertMessage("Notification deleted successfully");
        setNotifications((prev) => prev.filter(n => n._id !== notificationId)); // Remove from UI
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } else {
        setAlertMessage("Error: " + result.error);
      }
    } catch (error) {
      setAlertMessage("Deletion failed: " + error.message);
    }
  };

  const toggleTransactionHistory = () => {
    setTransactionHistoryVisible(!transactionHistoryVisible);
    if (!transactionHistoryVisible) fetchTransactionHistory();
  };

  const toggleNotifications = () => {
    setNotificationPanelVisible(!notificationPanelVisible);
    if (!notificationPanelVisible) fetchNotifications();
  };

  const handleFundsAction = (action) => {
    if (fundsLocked) {
      setAlertMessage("Funds activities are currently Disabled.");
      return;
    }
    if (action === "deposit") setDepositModalVisible(true);
    if (action === "withdraw") setWithdrawalModalVisible(true);
    if (action === "transfer") setTransferModalVisible(true);
  };

  const handleBack = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      window.location.href = "dashboard.html";
    }
  };

  const handleConvert = async () => {
    if (!convertAmount || isNaN(convertAmount) || Number(convertAmount) <= 0) {
      setConvertResult('Enter a valid amount.');
      return;
    }
    const userId = localStorage.getItem('userId');
    if (!userId) {
      setConvertResult('User not logged in.');
      return;
    }
    setConvertLoading(true);
    setConvertResult('');
    try {
      const res = await fetch('https://tradespots.online/api/funds/convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          amount: Number(convertAmount),
          direction: convertType === 'SPOT_TO_USDT' ? 'SPOT_TO_USDT' : 'USDT_TO_SPOT',
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setUserBalance(typeof data.balance === 'number' ? data.balance : 0);
        setUserSpotBalance(typeof data.spotBalance === 'number' ? data.spotBalance : 0);
        setConvertResult('Conversion successful!');
        setConvertAmount('');
        setExpectedConvertResult('');
      } else {
        setConvertResult(data.error || 'Conversion failed.');
      }
    } catch (e) {
      setConvertResult('Conversion failed. Please try again.');
    } finally {
      setConvertLoading(false);
    }
  };

  // Helper to compute expected conversion result
  const getExpectedConvertResult = (amount, type) => {
    if (!amount || isNaN(amount) || Number(amount) <= 0) return '';
    if (type === 'SPOT_TO_USDT') {
      return `${amount} SPOT = ${Number(amount) * 500} USDT`;
    } else {
      return `${amount} USDT = ${(Number(amount) / 500).toFixed(4)} SPOT`;
    }
  };

  function handleAllConvert() {
    if (convertType === 'SPOT_TO_USDT') {
      setConvertAmount(userSpotBalance ? userSpotBalance.toString() : '');
      setExpectedConvertResult(getExpectedConvertResult(userSpotBalance ? userSpotBalance.toString() : '', 'SPOT_TO_USDT'));
    } else {
      setConvertAmount(userBalance ? userBalance.toString() : '');
      setExpectedConvertResult(getExpectedConvertResult(userBalance ? userBalance.toString() : '', 'USDT_TO_SPOT'));
    }
  }

  // Theme-based colors
  const colors = {
    background: theme === "dark" ? "#121212" : "#f2f4f8",
    card: theme === "dark" ? "#333" : "#fff",
    border: theme === "dark" ? "#444" : "#e0e0e0",
    boxShadow: theme === "dark"
      ? "0 8px 20px rgba(255,255,255,0.15)"
      : "0 8px 20px rgba(0,0,0,0.15)",
    text: theme === "dark" ? "#f1f1f1" : "#333",
    subText: theme === "dark" ? "#bbb" : "#555",
    accent: theme === "dark" ? "#1e88e5" : "#007bff",
    inputBg: theme === "dark" ? "#232323" : "#fff",
    inputBorder: theme === "dark" ? "#444" : "#ddd",
    modalBg: theme === "dark" ? "#232323" : "#fff",
    modalText: theme === "dark" ? "#f1f1f1" : "#333",
    modalBoxShadow: theme === "dark"
      ? "0 8px 20px rgba(255,255,255,0.15)"
      : "0 8px 20px rgba(0,0,0,0.15)",
    overlay: "rgba(0,0,0,0.6)",
    panelBg: theme === "dark" ? "#232323" : "#fff",
    panelBorder: theme === "dark" ? "#444" : "#e0e0e0",
    panelShadow: theme === "dark"
      ? "0 4px 10px rgba(255,255,255,0.10)"
      : "0 4px 10px rgba(0,0,0,0.2)",
    panelItemBg: theme === "dark" ? "#181818" : "#f9f9f9",
    deleteBtn: "#ff4d4f",
  };

  return (
    <div
      style={{
        fontFamily: "'Segoe UI', sans-serif",
        backgroundColor: colors.background,
        color: colors.text,
        minHeight: "100vh",
        padding: "20px",
        position: "relative",
      }}
    >
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

      <button
        id="backBtn"
        onClick={handleBack}
        style={{
          position: "absolute",
          top: "30px",
          left: "10px",
          backgroundColor: colors.accent,
          color: "#fff",
          border: "none",
          borderRadius: "4px",
          padding: "8px 12px",
          cursor: "pointer",
          transition: "background-color 0.3s ease",
        }}
      >
        🔙 Back
      </button>

      {/* Notification and History Icons */}
      <div className="icon-container" style={{ position: "absolute", top: "30px", right: "10px", display: "flex", gap: "10px" }}>
        <button
          id="notificationIcon"
          onClick={toggleNotifications}
          style={{
            backgroundColor: colors.accent,
            color: "#fff",
            border: "none",
            borderRadius: "4px",
            padding: "8px 12px",
            cursor: "pointer",
            transition: "background-color 0.3s ease",
          }}
        >
          🔔 {unreadCount > 0 && (
            <span
              style={{
                backgroundColor: "red",
                borderRadius: "50%",
                padding: "2px 6px",
                color: "white",
              }}
            >
              {unreadCount}
            </span>
          )}
        </button>

        <button
          id="historyIcon"
          onClick={toggleTransactionHistory}
          style={{
            backgroundColor: colors.accent,
            color: "#fff",
            border: "none",
            borderRadius: "4px",
            padding: "8px 12px",
            cursor: "pointer",
            transition: "background-color 0.3s ease",
          }}
        >
          📜 History
        </button>
      </div>

      {/* Main Container */}
      <div
        className="container"
        style={{
          background: colors.card,
          padding: "30px",
          borderRadius: "12px",
          maxWidth: "900px",
          margin: "50px auto 0 auto",
          boxShadow: colors.boxShadow,
          border: `1px solid ${colors.border}`,
        }}
      >
        <h2 style={{ textAlign: "center", borderBottom: `2px solid ${colors.accent}`, paddingBottom: "10px", color: colors.text }}>
          Funds Management
        </h2>

        {/* Deposit Section */}
        <div className="box" style={{ background: colors.card, padding: "20px", borderRadius: "10px", marginBottom: "20px", border: `1px solid ${colors.border}`, boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
          <h3 style={{ color: colors.text }}>Deposit Funds</h3>
          <button
            onClick={() => handleFundsAction("deposit")}
            style={{
              backgroundColor: colors.accent,
              color: "#fff",
              border: "none",
              borderRadius: "4px",
              padding: "10px 15px",
              fontSize: "14px",
              cursor: "pointer",
              transition: "background-color 0.3s ease",
            }}
          >
            Deposit
          </button>
        </div>

        {/* Withdrawal Section */}
        <div className="box" style={{ background: colors.card, padding: "20px", borderRadius: "10px", marginBottom: "20px", border: `1px solid ${colors.border}`, boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
          <h3 style={{ color: colors.text }}>Withdraw Funds</h3>
          <button
            onClick={() => handleFundsAction("withdraw")}
            style={{
              backgroundColor: colors.accent,
              color: "#fff",
              border: "none",
              borderRadius: "4px",
              padding: "10px 15px",
              fontSize: "14px",
              cursor: "pointer",
              transition: "background-color 0.3s ease",
            }}
          >
            Withdraw
          </button>
        </div>

        {/* Transfer Section */}
        <div className="box" style={{ background: colors.card, padding: "20px", borderRadius: "10px", marginBottom: "20px", border: `1px solid ${colors.border}`, boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
          <h3 style={{ color: colors.text }}>Transfer Funds</h3>
          <button
            onClick={() => handleFundsAction("transfer")}
            style={{
              backgroundColor: colors.accent,
              color: "#fff",
              border: "none",
              borderRadius: "4px",
              padding: "10px 15px",
              fontSize: "14px",
              cursor: "pointer",
              transition: "background-color 0.3s ease",
            }}
          >
            Transfer
          </button>
        </div>

        {/* Convert Section */}
        <div className="box" style={{ background: colors.card, padding: "20px", borderRadius: "10px", marginBottom: "20px", border: `1px solid ${colors.border}`, boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
          <h3 style={{ color: colors.text }}>Convert Funds</h3>
          <button
            onClick={() => setConvertModalVisible(true)}
            style={{
              backgroundColor: colors.accent,
              color: "#fff",
              border: "none",
              borderRadius: "4px",
              padding: "10px 15px",
              fontSize: "14px",
              cursor: "pointer",
              transition: "background-color 0.3s ease",
            }}
          >
            Convert
          </button>
        </div>
      </div>

      {/* Deposit Modal */}
      {depositModalVisible && (
        <div
          className="modal"
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            position: "fixed",
            zIndex: 1000,
            left: 0,
            top: 0,
            width: "100%",
            height: "100%",
            backgroundColor: colors.overlay,
          }}
        >
          <div
            className="modal-content"
            style={{
              backgroundColor: colors.modalBg,
              color: colors.modalText,
              padding: "30px",
              borderRadius: "12px",
              maxWidth: "500px",
              width: "90%",
              maxHeight: "80vh",
              overflowY: "auto",
              boxShadow: colors.modalBoxShadow,
              animation: "fadeIn 0.3s ease-in-out",
            }}
          >
            <span
              className="close"
              onClick={() => setDepositModalVisible(false)}
              style={{
                float: "right",
                cursor: "pointer",
                fontSize: "20px",
                fontWeight: "bold",
                color: colors.text,
              }}
            >
              &times;
            </span>
            <h3 style={{ textAlign: "center", marginBottom: "20px", color: colors.accent }}>
              Deposit Funds
            </h3>
            <div>
              <h4 style={{ marginBottom: "10px", color: colors.text }}>USDT (TRC-20)</h4>
              <p>Send at least <strong>10 USDT</strong> to:</p>
              <p
                id="trc20Address"
                style={{
                  wordBreak: "break-all",
                  fontWeight: "bold",
                  backgroundColor: colors.inputBg,
                  color: colors.text,
                  padding: "10px",
                  borderRadius: "5px",
                  border: `1px solid ${colors.inputBorder}`,
                }}
              >
                TKvetYocdCX7zLXUg2bQAp67AMXorZrwFk
              </p>
              <button
                onClick={() => copyAddress("trc20Address")}
                style={{
                  backgroundColor: colors.accent,
                  color: "#fff",
                  border: "none",
                  borderRadius: "4px",
                  padding: "8px 12px",
                  cursor: "pointer",
                  marginTop: "10px",
                }}
              >
                Copy Address
              </button>
            </div>
            <div style={{ marginTop: "20px" }}>
              <p>Enter deposit amount:</p>
              <input
                type="number"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                placeholder="Amount"
                style={{
                  width: "100%",
                  padding: "10px",
                  border: `1px solid ${colors.inputBorder}`,
                  borderRadius: "5px",
                  marginBottom: "10px",
                  background: colors.inputBg,
                  color: colors.text,
                }}
              />
              <p>Enter your transaction ID (txid):</p>
              <input
                type="text"
                value={depositTxid}
                onChange={(e) => setDepositTxid(e.target.value)}
                placeholder="Transaction ID"
                style={{
                  width: "100%",
                  padding: "10px",
                  border: `1px solid ${colors.inputBorder}`,
                  borderRadius: "5px",
                  marginBottom: "20px",
                  background: colors.inputBg,
                  color: colors.text,
                }}
              />
              <button
                onClick={submitDeposit}
                style={{
                  backgroundColor: colors.accent,
                  color: "#fff",
                  border: "none",
                  borderRadius: "4px",
                  padding: "10px 15px",
                  fontSize: "14px",
                  cursor: "pointer",
                  width: "100%",
                }}
              >
                Submit Deposit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Withdrawal Modal */}
      {withdrawalModalVisible && (
        <div
          className="modal"
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            position: "fixed",
            zIndex: 1000,
            left: 0,
            top: 0,
            width: "100%",
            height: "100%",
            backgroundColor: colors.overlay,
          }}
        >
          <div
            className="modal-content"
            style={{
              backgroundColor: colors.modalBg,
              color: colors.modalText,
              padding: "30px",
              borderRadius: "12px",
              maxWidth: "500px",
              width: "90%",
              maxHeight: "80vh",
              overflowY: "auto",
              boxShadow: colors.modalBoxShadow,
              animation: "fadeIn 0.3s ease-in-out",
            }}
          >
            <span
              className="close"
              onClick={() => setWithdrawalModalVisible(false)}
              style={{
                float: "right",
                cursor: "pointer",
                fontSize: "20px",
                fontWeight: "bold",
                color: colors.text,
              }}
            >
              &times;
            </span>
            <h3 style={{ textAlign: "center", marginBottom: "20px", color: colors.accent }}>
              Withdraw Funds
            </h3>
            <div>
              <p>Enter withdrawal amount:</p>
              <input
                type="number"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                placeholder="Amount in USDT"
                style={{
                  width: "100%",
                  padding: "10px",
                  border: `1px solid ${colors.inputBorder}`,
                  borderRadius: "5px",
                  marginBottom: "10px",
                  background: colors.inputBg,
                  color: colors.text,
                }}
              />
              <p>Enter your wallet address:</p>
              <input
                type="text"
                value={withdrawWalletAddress}
                onChange={(e) => setWithdrawWalletAddress(e.target.value)}
                placeholder="Wallet Address"
                style={{
                  width: "100%",
                  padding: "10px",
                  border: `1px solid ${colors.inputBorder}`,
                  borderRadius: "5px",
                  marginBottom: "10px",
                  background: colors.inputBg,
                  color: colors.text,
                }}
              />
              <p>Enter your funding password:</p>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <input
                  type={showWithdrawFundingPassword ? "text" : "password"}
                  value={withdrawFundingPassword}
                  onChange={(e) => setWithdrawFundingPassword(e.target.value)}
                  placeholder="Funding Password"
                  style={{
                    flex: 1,
                    padding: "10px",
                    border: `1px solid ${colors.inputBorder}`,
                    borderRadius: "5px",
                    background: colors.inputBg,
                    color: colors.text,
                  }}
                />
                <button
                  onClick={() => setShowWithdrawFundingPassword(!showWithdrawFundingPassword)}
                  style={{
                    backgroundColor: colors.accent,
                    color: "#fff",
                    border: "none",
                    borderRadius: "4px",
                    padding: "8px 12px",
                    cursor: "pointer",
                  }}
                >
                  {showWithdrawFundingPassword ? "Hide" : "Show"}
                </button>
              </div>
              <p>Authenticator Code (2FA):</p>
              <input
                type="text"
                value={withdrawAuthenticatorCode}
                onChange={(e) => setWithdrawAuthenticatorCode(e.target.value)}
                placeholder="6-digit Code"
                style={{
                  width: "100%",
                  padding: "10px",
                  border: `1px solid ${colors.inputBorder}`,
                  borderRadius: "5px",
                  marginBottom: "20px",
                  background: colors.inputBg,
                  color: colors.text,
                }}
                maxLength={6}
                autoComplete="one-time-code"
              />
              <button
                onClick={submitWithdrawal}
                style={{
                  backgroundColor: colors.accent,
                  color: "#fff",
                  border: "none",
                  borderRadius: "4px",
                  padding: "10px 15px",
                  fontSize: "14px",
                  cursor: "pointer",
                  width: "100%",
                }}
              >
                Withdraw
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Transfer Modal */}
      {transferModalVisible && (
        <div
          className="modal"
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            position: "fixed",
            zIndex: 1000,
            left: 0,
            top: 0,
            width: "100%",
            height: "100%",
            backgroundColor: colors.overlay,
          }}
        >
          <div
            className="modal-content"
            style={{
              backgroundColor: colors.modalBg,
              color: colors.modalText,
              padding: "30px",
              borderRadius: "12px",
              maxWidth: "500px",
              width: "90%",
              maxHeight: "80vh",
              overflowY: "auto",
              boxShadow: colors.modalBoxShadow,
              animation: "fadeIn 0.3s ease-in-out",
            }}
          >
            <span
              className="close"
              onClick={() => setTransferModalVisible(false)}
              style={{
                float: "right",
                cursor: "pointer",
                fontSize: "20px",
                fontWeight: "bold",
                color: colors.text,
              }}
            >
              &times;
            </span>
            <h3 style={{ textAlign: "center", marginBottom: "20px", color: colors.accent }}>
              Transfer Funds
            </h3>
            <div>
              <p>Enter transfer amount:</p>
              <input
                type="number"
                value={transferAmount}
                onChange={(e) => setTransferAmount(e.target.value)}
                placeholder="Amount in SPOT"
                style={{
                  width: "100%",
                  padding: "10px",
                  border: `1px solid ${colors.inputBorder}`,
                  borderRadius: "5px",
                  marginBottom: "10px",
                  background: colors.inputBg,
                  color: colors.text,
                }}
              />
              <p>Enter verification code:</p>
              <div style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
                <input
                  type="text"
                  value={transferVerificationCode}
                  onChange={(e) => setTransferVerificationCode(e.target.value)}
                  placeholder="8-digit Code"
                  style={{
                    flex: 1,
                    padding: "10px",
                    border: `1px solid ${colors.inputBorder}`,
                    borderRadius: "5px",
                    background: colors.inputBg,
                    color: colors.text,
                  }}
                />
                <button
                  onClick={sendTransferVerificationCode}
                  style={{
                    backgroundColor: colors.accent,
                    color: "#fff",
                    border: "none",
                    borderRadius: "4px",
                    padding: "10px 15px",
                    fontSize: "14px",
                    cursor: "pointer",
                  }}
                >
                  Send Code
                </button>
              </div>
              <p>Enter funding password:</p>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <input
                  type={showTransferFundingPassword ? "text" : "password"}
                  value={transferFundingPassword}
                  onChange={(e) => setTransferFundingPassword(e.target.value)}
                  placeholder="Funding Password"
                  style={{
                    flex: 1,
                    padding: "10px",
                    border: `1px solid ${colors.inputBorder}`,
                    borderRadius: "5px",
                    background: colors.inputBg,
                    color: colors.text,
                  }}
                />
                <button
                  onClick={() => setShowTransferFundingPassword(!showTransferFundingPassword)}
                  style={{
                    backgroundColor: colors.accent,
                    color: "#fff",
                    border: "none",
                    borderRadius: "4px",
                    padding: "8px 12px",
                    cursor: "pointer",
                  }}
                >
                  {showTransferFundingPassword ? "Hide" : "Show"}
                </button>
              </div>
              <p>Enter recipient's email:</p>
              <input
                type="email"
                value={transferRecipientEmail}
                onChange={(e) => setTransferRecipientEmail(e.target.value)}
                placeholder="Recipient Email"
                style={{
                  width: "100%",
                  padding: "10px",
                  border: `1px solid ${colors.inputBorder}`,
                  borderRadius: "5px",
                  marginBottom: "20px",
                  background: colors.inputBg,
                  color: colors.text,
                }}
              />
              <button
                onClick={submitTransfer}
                style={{
                  backgroundColor: colors.accent,
                  color: "#fff",
                  border: "none",
                  borderRadius: "4px",
                  padding: "10px 15px",
                  fontSize: "14px",
                  cursor: "pointer",
                  width: "100%",
                }}
              >
                Submit Transfer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Convert Modal */}
      {convertModalVisible && (
        <div
          className="modal"
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            position: 'fixed',
            zIndex: 1000,
            left: 0,
            top: 0,
            width: '100%',
            height: '100%',
            backgroundColor: colors.overlay,
          }}
        >
          <div
            className="modal-content"
            style={{
              backgroundColor: colors.modalBg,
              color: colors.modalText,
              padding: '30px',
              borderRadius: '12px',
              maxWidth: '400px',
              width: '90%',
              boxShadow: colors.modalBoxShadow,
              animation: 'fadeIn 0.3s ease-in-out',
            }}
          >
            <span
              className="close"
              onClick={() => {
                setConvertModalVisible(false);
                setConvertResult('');
                setConvertAmount('');
                setExpectedConvertResult('');
              }}
              style={{
                float: 'right',
                cursor: 'pointer',
                fontSize: '20px',
                fontWeight: 'bold',
                color: colors.text,
              }}
            >
              &times;
            </span>
            <h3 style={{ textAlign: 'center', marginBottom: '20px', color: colors.accent }}>
              Convert {convertType === 'SPOT_TO_USDT' ? 'SPOT to USDT' : 'USDT to SPOT'}
            </h3>
            <div style={{ marginBottom: '15px', display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button
                onClick={() => {
                  setConvertType('SPOT_TO_USDT');
                  setConvertResult('');
                  setConvertAmount('');
                  setExpectedConvertResult('');
                }}
                style={{
                  backgroundColor: convertType === 'SPOT_TO_USDT' ? colors.accent : colors.inputBg,
                  color: convertType === 'SPOT_TO_USDT' ? '#fff' : colors.text,
                  border: 'none',
                  borderRadius: '4px',
                  padding: '8px 16px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                }}
              >
                SPOT → USDT
              </button>
              <button
                onClick={() => {
                  setConvertType('USDT_TO_SPOT');
                  setConvertResult('');
                  setConvertAmount('');
                  setExpectedConvertResult('');
                }}
                style={{
                  backgroundColor: convertType === 'USDT_TO_SPOT' ? colors.accent : colors.inputBg,
                  color: convertType === 'USDT_TO_SPOT' ? '#fff' : colors.text,
                  border: 'none',
                  borderRadius: '4px',
                  padding: '8px 16px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                }}
              >
                USDT → SPOT
              </button>
            </div>
            <div style={{ marginBottom: '15px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  type="number"
                  value={convertAmount}
                  onChange={e => {
                    setConvertAmount(e.target.value);
                    setExpectedConvertResult(getExpectedConvertResult(e.target.value, convertType));
                    setConvertResult(''); // Clear backend result on input change
                  }}
                  placeholder={convertType === 'SPOT_TO_USDT' ? 'Amount in SPOT' : 'Amount in USDT'}
                  style={{
                    flex: 1,
                    padding: 8,
                    borderRadius: 5,
                    border: `1px solid ${colors.inputBorder}`,
                    background: colors.inputBg,
                    color: colors.text,
                  }}
                />
                <button
                  type="button"
                  onClick={handleAllConvert}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 5,
                    background: colors.accent,
                    color: '#fff',
                    border: 'none',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                  }}
                >
                  ALL
                </button>
              </div>
              {expectedConvertResult && (
                <div style={{ textAlign: 'center', color: colors.accent, fontWeight: 'bold', marginBottom: '10px' }}>{expectedConvertResult}</div>
              )}
              <button
                onClick={handleConvert}
                style={{
                  backgroundColor: colors.accent,
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '10px 15px',
                  fontSize: '14px',
                  cursor: convertLoading ? 'not-allowed' : 'pointer',
                  width: '100%',
                  opacity: convertLoading ? 0.7 : 1,
                }}
                disabled={convertLoading}
              >
                {convertLoading ? 'Converting...' : 'Convert'}
              </button>
            </div>
            {convertResult && (
              <div style={{ textAlign: 'center', color: convertResult === 'Conversion successful!' ? 'green' : colors.accent, fontWeight: 'bold', marginTop: '10px' }}>{convertResult}</div>
            )}
            <div style={{ textAlign: 'center', marginTop: '10px', color: colors.subText, fontSize: '12px' }}>
              1 SPOT = 500 USDT
            </div>
            <div style={{ textAlign: 'center', marginTop: '5px', color: colors.accent, fontWeight: 'bold', fontSize: '13px' }}>
              {userBalance !== null && userSpotBalance !== null ? (
                <span>
                  Your Balance:<br />
                  {userBalance} USDT<br />
                  {userSpotBalance} SPOT
                </span>
              ) : 'Loading balance...'}
            </div>
          </div>
        </div>
      )}

      {/* Transaction History Panel */}
      {transactionHistoryVisible && (
        <div
          className="panel-overlay"
          onClick={() => setTransactionHistoryVisible(false)}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: colors.overlay,
            zIndex: 999,
          }}
        >
          <div
            className="panel"
            onClick={(e) => e.stopPropagation()}
            style={{
              position: "fixed",
              top: "70px",
              right: "20px",
              background: colors.panelBg,
              color: colors.text,
              padding: "20px",
              borderRadius: "10px",
              width: "300px",
              zIndex: 1000,
              boxShadow: colors.panelShadow,
              border: `1px solid ${colors.panelBorder}`,
            }}
          >
            <h3 style={{ marginBottom: "15px", color: colors.accent, textAlign: "center" }}>
              Transaction History
            </h3>
            <div
              style={{
                maxHeight: "400px",
                overflowY: "auto",
                paddingRight: "10px",
                border: `1px solid ${colors.panelBorder}`,
                borderRadius: "5px",
              }}
            >
              {transactionHistory.length > 0 ? (
                transactionHistory.map((tx) => (
                  <div
                    key={tx._id}
                    style={{
                      marginBottom: "10px",
                      padding: "10px",
                      border: `1px solid ${colors.panelBorder}`,
                      borderRadius: "5px",
                      backgroundColor: colors.panelItemBg,
                      color: colors.text,
                      boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div>
                      <p style={{ fontWeight: "bold", marginBottom: "5px" }}>
                        {tx.type.toUpperCase()}: {tx.amount} USDT
                      </p>
                      <p style={{ fontSize: "12px", color: colors.subText }}>
                        {new Date(tx.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <button
                      onClick={() => deleteTransaction(tx._id)}
                      style={{
                        backgroundColor: "transparent",
                        border: "none",
                        cursor: "pointer",
                        color: colors.deleteBtn,
                        fontSize: "16px",
                        marginLeft: "10px",
                      }}
                    >
                      🗑
                    </button>
                  </div>
                ))
              ) : (
                <p style={{ textAlign: "center", color: colors.subText }}>No transactions found.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Notification Panel */}
      {notificationPanelVisible && (
        <div
          className="panel-overlay"
          onClick={() => setNotificationPanelVisible(false)}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: colors.overlay,
            zIndex: 999,
          }}
        >
          <div
            className="panel"
            onClick={(e) => e.stopPropagation()}
            style={{
              position: "fixed",
              top: "70px",
              right: "20px",
              background: colors.panelBg,
              color: colors.text,
              padding: "20px",
              borderRadius: "10px",
              width: "300px",
              zIndex: 1000,
              boxShadow: colors.panelShadow,
              border: `1px solid ${colors.panelBorder}`,
            }}
          >
            <h3 style={{ marginBottom: "15px", color: colors.accent, textAlign: "center" }}>
              Notifications
            </h3>
            <div
              style={{
                maxHeight: "400px",
                overflowY: "auto",
                paddingRight: "10px",
                border: `1px solid ${colors.panelBorder}`,
                borderRadius: "5px",
              }}
            >
              {notifications.length > 0 ? (
                notifications.map((n) => (
                  <div
                    key={n._id}
                    style={{
                      marginBottom: "10px",
                      padding: "10px",
                      border: `1px solid ${colors.panelBorder}`,
                      borderRadius: "5px",
                      backgroundColor: colors.panelItemBg,
                      color: colors.text,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <span style={{ flex: 1, marginRight: "10px" }}>{n.message}</span>
                    <button
                      onClick={() => deleteNotification(n._id)}
                      style={{
                        backgroundColor: "transparent",
                        border: "none",
                        cursor: "pointer",
                        color: colors.deleteBtn,
                        fontSize: "16px",
                      }}
                    >
                      🗑
                    </button>
                  </div>
                ))
              ) : (
                <p style={{ textAlign: "center", color: colors.subText }}>No notifications found.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FundsManagement;