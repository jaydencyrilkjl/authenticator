import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import StyledAlert from "./components/StyledAlert";
import { ThemeContext } from "./App"; // Import ThemeContext

const ContactUs = () => {
  const navigate = useNavigate();
  const { theme } = useContext(ThemeContext); // Use theme context
  const [message, setMessage] = useState("");
  const [alertMessage, setAlertMessage] = useState("");
  const [adminMessages, setAdminMessages] = useState([]);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [alertCallback, setAlertCallback] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      setAlertMessage("User not authenticated! Please log in.");
      setAlertCallback(() => () => navigate("/login"));
      return;
    }
    fetchAdminMessages(token);
    // eslint-disable-next-line
  }, [navigate]);

  const fetchAdminMessages = async (token) => {
    try {
      const userId = localStorage.getItem("userId");
      if (!userId) {
        setAlertMessage("User not authenticated. Please log in.");
        setAlertCallback(() => () => navigate("/login"));
        return;
      }
      const response = await fetch(`https://tradespots.online/api/admin/user/messages/${userId}`,
        token ? { headers: { Authorization: `Bearer ${token}` } } : undefined
      );
      if (!response.ok) {
        setAlertMessage("Failed to fetch messages. Please try again later.");
        return;
      }
      const data = await response.json();
      setAdminMessages(data.messages || []);
    } catch (error) {
      setAlertMessage("Network error: Unable to fetch messages. Please check your connection.");
    }
  };

  const deleteMessage = async (messageId) => {
    const token = localStorage.getItem("authToken");
    try {
      const userId = localStorage.getItem("userId");
      if (!userId) {
        setAlertMessage("User not authenticated.");
        setAlertCallback(() => () => navigate("/login"));
        return;
      }
      const response = await fetch(`https://tradespots.online/api/admin/user/delete-message/${userId}/${messageId}`,
        {
          method: "DELETE",
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        }
      );
      const data = await response.json();
      if (data.success) {
        setAlertMessage("Message deleted successfully!");
        fetchAdminMessages(token);
      } else {
        setAlertMessage("Error deleting message: " + data.error);
      }
    } catch (error) {
      setAlertMessage("Error deleting message: " + error.message);
    }
  };

  const sendMessage = async () => {
    if (!message.trim()) {
      setAlertMessage("Please enter a message.");
      return;
    }
    const userId = localStorage.getItem("userId");
    const token = localStorage.getItem("authToken");
    if (!userId || !token) {
      setAlertMessage("User not authenticated.");
      setAlertCallback(() => () => navigate("/login"));
      return;
    }
    try {
      const response = await fetch("https://tradespots.online/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ message, userId }),
      });
      const data = await response.json();
      setAlertMessage(data.message);
      if (response.ok) {
        setMessage("");
      }
    } catch (error) {
      setAlertMessage("Error sending message: " + error.message);
    }
  };

  const openMessageModal = (message) => {
    setSelectedMessage(message);
    setModalVisible(true);
  };

  const closeMessageModal = () => {
    setSelectedMessage(null);
    setModalVisible(false);
  };

  // Theme-based colors
  const isDark = theme === "dark";
  const bgMain = isDark ? "#121212" : "linear-gradient(135deg, #1e3c72, #2a5298)";
  const colorMain = isDark ? "#f1f1f1" : "#333";
  const cardBg = isDark ? "#23272f" : "#fff";
  const cardShadow = isDark ? "0 8px 20px rgba(255,255,255,0.08)" : "0 8px 15px rgba(0,0,0,0.1)";
  const borderColor = isDark ? "#333" : "#ccc";
  const btnBg = isDark ? "#1e88e5" : "#007bff";
  const btnHover = isDark ? "#1565c0" : "#16325c";
  const modalBg = isDark ? "#23272f" : "#fff";

  return (
    <div
      style={{
        margin: 0,
        fontFamily: "'Segoe UI', sans-serif",
        background: bgMain,
        color: colorMain,
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        padding: "20px",
        transition: "background 0.3s, color 0.3s",
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

      <div style={{ width: "100%", maxWidth: 1200, position: "relative" }}>
        <button
          id="backBtn"
          onClick={() => (window.history.length > 1 ? navigate(-1) : navigate("/dashboard"))}
          style={{
            position: "absolute",
            top: "0px",
            left: "0px",
            fontSize: "14px",
            backgroundColor: btnBg,
            color: "#fff",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
            padding: "10px 15px",
            boxShadow: "0 4px 6px rgba(0,0,0,0.2)",
            transition: "background-color 0.3s, transform 0.3s",
            zIndex: 2,
          }}
          onMouseOver={e => (e.target.style.transform = "scale(1.05)")}
          onMouseOut={e => (e.target.style.transform = "scale(1)")}
        >
          🔙 Back
        </button>
      </div>

      <div
        className="container"
        style={{
          background: cardBg,
          color: colorMain,
          padding: "20px",
          borderRadius: "5px",
          boxShadow: cardShadow,
          maxWidth: "400px",
          width: "100%",
          textAlign: "center",
          marginTop: "60px",
          border: `1px solid ${borderColor}`,
          transition: "background 0.3s, color 0.3s",
        }}
      >
        <h1 style={{ fontSize: "28px", marginBottom: "15px", color: isDark ? "#90caf9" : "#1e3c72" }}>Contact Us</h1>
        <p style={{ fontSize: "14px", color: isDark ? "#bbb" : "#555", marginBottom: "20px" }}>
          Have questions or need assistance? Send us a message and we'll get back to you as soon as possible.
        </p>
        <textarea
          id="message"
          placeholder="Your Message"
          rows="4"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          style={{
            width: "100%",
            padding: "10px",
            margin: "10px 0",
            borderRadius: "5px",
            border: `1px solid ${borderColor}`,
            fontSize: "14px",
            resize: "none",
            background: isDark ? "#181c22" : "#fff",
            color: colorMain,
            transition: "background 0.3s, color 0.3s",
          }}
        />
        <button
          className="btn"
          onClick={sendMessage}
          style={{
            width: "100%",
            padding: "10px",
            background: btnBg,
            color: "#fff",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
            fontSize: "16px",
            transition: "background 0.3s",
          }}
          onMouseOver={e => (e.target.style.background = btnHover)}
          onMouseOut={e => (e.target.style.background = btnBg)}
        >
          Send Message
        </button>

        {/* Contact Icons Section */}
        <div style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: "24px",
          marginTop: "24px",
        }}>
          {/* Telegram Icon */}
          <a
  href="https://t.me/tradespothelp"
  target="_blank"
  rel="noopener noreferrer"
  title="Contact us on Telegram"
  style={{ display: "inline-block", marginRight: "10px" }}
>
  <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 240 240" fill="none">
    <circle cx="120" cy="120" r="120" fill="#229ED9" />
    <path
      d="M177.2 66.1 47.7 115.4c-5.7 2.2-5.5 10.6.3 12.4l31.5 9.9 11.9 36.4c1.5 4.6 7 6.2 10.7 3.1l17.3-14.6 35.9 26.4c3.7 2.7 9 0.6 10-3.7l28.6-122.5c1.1-4.7-3.4-8.7-7.7-7.3z"
      fill="#fff"
    />
  </svg>
</a>

          {/* Email Icon */}
          <a
  href="mailto:support@tradespot.online"
  title="Email support@tradespot.online"
  style={{ display: "inline-block" }}
>
  <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="12" fill="#007BFF" />
    <path
      d="M17.5 8h-11A1.5 1.5 0 0 0 5 9.5v5A1.5 1.5 0 0 0 6.5 16h11a1.5 1.5 0 0 0 1.5-1.5v-5A1.5 1.5 0 0 0 17.5 8zm-.22 1-5.28 3.3L6.72 9h10.56zM6 14.13V9.87l5.03 3.15a.5.5 0 0 0 .54 0L17 9.87v4.26H6z"
      fill="#fff"
    />
  </svg>
</a>

          {/* Tradespot GroupChat Icon */}
          <a
            href="https://tradespot.online/Slogin"
            target="_blank"
            rel="noopener noreferrer"
            title="Join our Group Chat"
            style={{ display: "inline-block" }}
          >
            <img
              src={require("./tradespot-login.jpg")}
              alt="Group Chat"
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "8px",
                objectFit: "cover",
                boxShadow: isDark ? "0 2px 8px rgba(255,255,255,0.08)" : "0 2px 8px rgba(0,0,0,0.12)",
                border: `2px solid ${borderColor}`,
                cursor: "pointer",
              }}
            />
          </a>
        </div>
      </div>

      {/* Admin Messages Section */}
      <div
        className="admin-messages"
        style={{
          background: cardBg,
          color: colorMain,
          padding: "20px",
          borderRadius: "15px",
          boxShadow: isDark ? "0 12px 25px rgba(255,255,255,0.08)" : "0 12px 25px rgba(0,0,0,0.2)",
          maxWidth: "600px",
          width: "100%",
          marginTop: "20px",
          border: `1px solid ${borderColor}`,
          transition: "background 0.3s, color 0.3s",
        }}
      >
        <h2
          style={{
            fontSize: "24px",
            marginBottom: "10px",
            color: isDark ? "#90caf9" : "#1e3c72",
            textAlign: "center",
          }}
        >
          Admin Messages
        </h2>
        {adminMessages.length === 0 ? (
          <p style={{ color: isDark ? "#bbb" : "#555" }}>No messages from admin yet.</p>
        ) : (
          <ul style={{ listStyle: "none", padding: 0 }}>
            {adminMessages.map((msg) => (
              <li
                key={msg._id}
                style={{
                  borderBottom: `1px solid ${borderColor}`,
                  padding: "10px 0",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <p style={{ margin: 0, fontWeight: "bold" }}>{msg.title}</p>
                  <p style={{ margin: 0, fontSize: "12px", color: isDark ? "#aaa" : "#888" }}>
                    {new Date(msg.createdAt).toLocaleString()}
                  </p>
                </div>
                <div>
                  <button
                    onClick={() => openMessageModal(msg)}
                    style={{
                      marginRight: "10px",
                      background: btnBg,
                      color: "#fff",
                      border: "none",
                      borderRadius: "5px",
                      padding: "5px 10px",
                      cursor: "pointer",
                    }}
                  >
                    View
                  </button>
                  <button
                    onClick={() => deleteMessage(msg._id)}
                    style={{
                      background: "red",
                      color: "#fff",
                      border: "none",
                      borderRadius: "5px",
                      padding: "5px 10px",
                      cursor: "pointer",
                    }}
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Message Modal */}
      {modalVisible && selectedMessage && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
          }}
          onClick={closeMessageModal}
        >
          <div
            style={{
              background: modalBg,
              color: colorMain,
              padding: "20px",
              borderRadius: "10px",
              maxWidth: "500px",
              width: "90%",
              maxHeight: "80%",
              overflowY: "auto",
              boxShadow: cardShadow,
              border: `1px solid ${borderColor}`,
              transition: "background 0.3s, color 0.3s",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ marginTop: 0 }}>{selectedMessage.title}</h3>
            <p>{selectedMessage.content}</p>
            <p style={{ fontSize: "12px", color: isDark ? "#aaa" : "#888" }}>
              {new Date(selectedMessage.createdAt).toLocaleString()}
            </p>
            <button
              onClick={closeMessageModal}
              style={{
                background: btnBg,
                color: "#fff",
                border: "none",
                borderRadius: "5px",
                padding: "10px 15px",
                cursor: "pointer",
                marginTop: "10px",
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContactUs;