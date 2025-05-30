import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import StyledAlert from "./components/StyledAlert"; // Import StyledAlert

const NotificationManager = () => {
  const [currentNotification, setCurrentNotification] = useState("");
  const [notificationMessage, setNotificationMessage] = useState("");
  const [alertMessage, setAlertMessage] = useState(""); // State for alert message
  const navigate = useNavigate();

  useEffect(() => {
    const storedNotification = localStorage.getItem("platformNotification");
    if (storedNotification) {
      setCurrentNotification(storedNotification);
    }
  }, []);

  const handleSaveNotification = (event) => {
    event.preventDefault();
    localStorage.setItem("platformNotification", notificationMessage);
    setAlertMessage("Notification saved successfully."); // Set alert message
    setCurrentNotification(notificationMessage);
    setNotificationMessage("");
  };

  const handleDeleteNotification = () => {
    localStorage.removeItem("platformNotification");
    setCurrentNotification("");
    setAlertMessage("Notification deleted successfully."); // Set alert message
  };

  const handleCopyNotification = () => {
    if (navigator.clipboard) {
      navigator.clipboard
        .writeText(currentNotification)
        .then(() => setAlertMessage("Notification copied to clipboard.")) // Set alert message
        .catch(() => setAlertMessage("Failed to copy notification.")); // Set alert message
    } else {
      setAlertMessage("Clipboard API not available."); // Set alert message
    }
  };

  const handleEditNotification = () => {
    setNotificationMessage(currentNotification);
  };

  return (
    <div style={styles.body}>
      {/* StyledAlert */}
      {alertMessage && (
        <StyledAlert
          message={alertMessage}
          onClose={() => {
            setAlertMessage(""); // Clear alert
          }}
        />
      )}

      <div style={styles.container}>
        <h2 style={styles.header}>Notification Manager</h2>
        <button style={styles.backBtn} onClick={() => navigate("/admindb")}>
          Back
        </button>

        {currentNotification && (
          <div style={styles.notificationDisplay}>
            <strong>Current Notification:</strong>
            <p style={styles.notificationText}>{currentNotification}</p>
            <button style={styles.copyBtn} onClick={handleCopyNotification}>
              Copy
            </button>
            <button style={styles.editBtn} onClick={handleEditNotification}>
              Edit
            </button>
            <button style={styles.deleteBtn} onClick={handleDeleteNotification}>
              Delete Notification
            </button>
          </div>
        )}

        <form onSubmit={handleSaveNotification} style={styles.form}>
          <label htmlFor="notificationMessage" style={styles.label}>
            New Notification Message:
          </label>
          <textarea
            id="notificationMessage"
            style={styles.textarea}
            placeholder="Type your notification here..."
            value={notificationMessage}
            onChange={(e) => setNotificationMessage(e.target.value)}
            required
          />
          <br />
          <button type="submit" style={styles.saveBtn}>
            {currentNotification ? "Update Notification" : "Save Notification"}
          </button>
        </form>
      </div>
    </div>
  );
};

const styles = {
  container: {
    background: "#000000", // Container background remains black
    border: "2px solid #b8860b",
    padding: "30px",
    borderRadius: "8px",
    width: "90%",
    maxWidth: "600px",
    margin: "0 auto",
    boxShadow: "0px 0px 15px rgba(0, 0, 0, 0.5)",
    textAlign: "center",
    color: "#ffffff",
    minHeight: "100vh", // Ensures the background covers the viewport
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
  },
  body: {
    background: "#000000", // Outside the container is now black
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  header: {
    textAlign: "center",
    marginBottom: "20px",
    color: "#b8860b",
  },
  backBtn: {
    padding: "10px 20px",
    background: "#333333",
    color: "#ffffff",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
    marginBottom: "20px",
  },
  notificationDisplay: {
    background: "#292929",
    padding: "15px",
    borderRadius: "5px",
    marginBottom: "20px",
    border: "1px solid #b8860b",
  },
  notificationText: {
    margin: "10px 0",
  },
  textarea: {
    width: "95%",
    height: "100px",
    marginTop: "10px",
    padding: "10px",
    borderRadius: "4px",
    border: "1px solid #b8860b",
    background: "#000",
    color: "#FFD700",
    resize: "vertical",
  },
  saveBtn: {
    padding: "10px 20px",
    background: "#004d00",
    color: "#ffffff",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
    marginTop: "10px",
    marginRight: "10px", // Adds spacing between buttons
  },
  deleteBtn: {
    background: "#b80000",
    marginLeft: "10px",
    padding: "10px 20px",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
    color: "#ffffff",
    marginTop: "10px", // Adds spacing between buttons
  },
  editBtn: {
    background: "#00509e",
    marginLeft: "10px",
    padding: "10px 20px",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
    color: "#ffffff",
    marginTop: "10px", // Adds spacing between buttons
  },
  copyBtn: {
    background: "#555555",
    marginLeft: "10px",
    padding: "10px 20px",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
    color: "#ffffff",
    marginTop: "10px", // Adds spacing between buttons
  },
  label: {
    display: "block",
    marginTop: "15px",
    fontWeight: "bold",
    color: "#b8860b",
  },
};

export default NotificationManager;
