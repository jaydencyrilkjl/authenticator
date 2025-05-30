import React, { useEffect, useState } from "react";
import axios from "axios";

const AdminContact = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [searchEmail, setSearchEmail] = useState(""); // Add search state
  const [filteredMessages, setFilteredMessages] = useState([]); // For search results

  useEffect(() => {
    // Apply global styles to the body element (like deposits.js)
    document.body.style.backgroundColor = "#121212";
    document.body.style.margin = "0";
    document.body.style.color = "#ffffff";
    return () => {
      document.body.style.backgroundColor = "";
      document.body.style.margin = "";
      document.body.style.color = "";
    };
  }, []);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const res = await axios.get("https://tradespots.online/api/admin-contact");
        setMessages(res.data);
        setFilteredMessages(res.data); // Initialize filtered messages
      } catch (err) {
        setError("Failed to fetch messages");
      } finally {
        setLoading(false);
      }
    };
    fetchMessages();
  }, []);

  // Search handler
  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchEmail.trim()) {
      setFilteredMessages(messages);
    } else {
      const filtered = messages.filter(
        (msg) =>
          msg.senderEmail &&
          msg.senderEmail.toLowerCase() === searchEmail.trim().toLowerCase()
      );
      setFilteredMessages(filtered);
    }
  };

  const openModal = (msg) => {
    setSelectedMessage(msg);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedMessage(null);
  };

  // Delete message handler
  const handleDelete = async () => {
    if (!selectedMessage?._id) return;
    try {
      await axios.delete(`https://tradespots.online/api/admin-contact/${selectedMessage._id}`);
      setMessages(messages.filter(msg => msg._id !== selectedMessage._id));
      setFilteredMessages(filteredMessages.filter(msg => msg._id !== selectedMessage._id));
      closeModal();
    } catch (err) {
      alert("Failed to delete message.");
    }
  };

  // Styles (copied/adapted from deposits.js)
  const bodyStyle = {
    fontFamily: "Arial, sans-serif",
    backgroundColor: "#121212",
    color: "#ffffff",
    textAlign: "center",
    padding: "20px",
    fontSize: "14px",
    maxWidth: "100%",
    overflowX: "hidden",
  };

  const tableContainerStyle = {
    overflowX: "auto",
    marginTop: "20px",
  };

  const tableStyle = {
    width: "100%",
    minWidth: 600,
    marginTop: "20px",
    borderCollapse: "collapse",
    fontSize: "13px",
    background: "#222",
    borderRadius: 8,
  };

  const thStyle = {
    border: "1px solid #ffffff",
    padding: "10px",
    textAlign: "left",
    background: "linear-gradient(135deg, #004d00, #b8860b)",
  };

  const tdStyle = {
    border: "1px solid #ffffff",
    padding: "10px",
    textAlign: "left",
    wordBreak: "break-all",
  };

  const backButtonStyle = {
    position: "absolute",
    top: "10px",
    left: "10px",
    background: "rgba(227, 236, 239, 0.1)",
    color: "rgba(255, 255, 255, 0.7)",
    border: "none",
    padding: "5px 10px",
    fontSize: "12px",
    borderRadius: "5px",
    cursor: "pointer",
    transition: "0.3s",
  };

  const headerStyle = {
    fontSize: "1.5em",
    fontWeight: "bold",
    background: "linear-gradient(135deg, #004d00, #b8860b)",
    padding: "15px",
    borderRadius: "8px",
    marginBottom: "10px",
    marginTop: 0,
  };

  const paragraphStyle = {
    background: "rgba(255, 255, 255, 0.1)",
    padding: "15px",
    borderRadius: "10px",
    boxShadow: "2px 2px 10px rgba(255, 255, 255, 0.2)",
    display: "inline-block",
    textAlign: "center",
    marginBottom: 20,
  };

  const actionButtonStyle = {
    backgroundColor: "#b8860b",
    color: "#ffffff",
    border: "none",
    padding: "5px 10px",
    cursor: "pointer",
    transition: "background-color 0.3s",
    fontSize: "13px",
    borderRadius: 4,
  };

  const actionButtonHoverStyle = {
    backgroundColor: "#8b5e00",
  };

  const modalStyle = {
    display: "block",
    position: "fixed",
    zIndex: 10,
    left: 0,
    top: 0,
    width: "100%",
    height: "100%",
    overflow: "auto",
    backgroundColor: "rgba(0, 0, 0, 0.6)",
  };

  const modalContentStyle = {
    backgroundColor: "#222",
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    padding: "10px",
    border: "1px solid #888",
    width: "90%",
    maxWidth: "400px",
    borderRadius: "8px",
    textAlign: "center",
    fontSize: "12px",
    color: "#fff",
    boxShadow: "0 2px 16px rgba(0,0,0,0.4)",
    display: 'flex',
    flexDirection: 'column',
    maxHeight: '70vh',
    overflow: 'hidden',
  };

  const modalHeaderStyle = {
    marginTop: "0",
    marginBottom: "15px",
    fontSize: "16px",
  };

  return (
    <div style={bodyStyle}>
      <button
        onClick={() => window.location.href = '/admindb'}
        style={backButtonStyle}
      >
        ← Back
      </button>
      <div style={headerStyle}>Admin Contact Messages</div>
      <p style={paragraphStyle}>View and manage messages sent to admin.</p>
      {/* Search Bar */}
      <form onSubmit={handleSearch} style={{ margin: "20px auto", maxWidth: 400, display: "flex", gap: 8 }}>
        <input
          type="text"
          placeholder="Search by Email..."
          value={searchEmail}
          onChange={e => setSearchEmail(e.target.value)}
          style={{
            flex: 1,
            padding: "8px",
            borderRadius: "5px",
            border: "1px solid #b8860b",
            outline: "none",
            fontSize: "14px",
            background: "#181818",
            color: "#fff"
          }}
        />
        <button
          type="submit"
          style={{
            background: "#b8860b",
            color: "#fff",
            border: "none",
            borderRadius: "5px",
            padding: "8px 16px",
            cursor: "pointer",
            fontWeight: "bold"
          }}
        >
          Search
        </button>
      </form>
      {loading ? (
        <p>Loading...</p>
      ) : error ? (
        <p style={{ color: 'red' }}>{error}</p>
      ) : (
        <div style={tableContainerStyle}>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Sender Email</th>
                <th style={thStyle}>SPOTID</th>
                <th style={thStyle}>Message</th>
                <th style={thStyle}>Date</th>
              </tr>
            </thead>
            <tbody>
              {filteredMessages.length === 0 ? (
                <tr>
                  <td colSpan="4" style={tdStyle}>
                    {searchEmail.trim() ? "Not found" : "No messages found."}
                  </td>
                </tr>
              ) : (
                filteredMessages.map(msg => (
                  <tr key={msg._id}>
                    <td style={tdStyle}>{msg.senderEmail}</td>
                    <td style={tdStyle}>{msg.spotId}</td>
                    <td style={tdStyle}>
                      <button
                        style={actionButtonStyle}
                        onMouseOver={e => e.target.style.backgroundColor = actionButtonHoverStyle.backgroundColor}
                        onMouseOut={e => e.target.style.backgroundColor = actionButtonStyle.backgroundColor}
                        onClick={() => openModal(msg)}
                      >
                        View
                      </button>
                    </td>
                    <td style={tdStyle}>{new Date(msg.createdAt).toLocaleString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
      {/* Modal */}
      {modalOpen && selectedMessage && (
        <div style={modalStyle}>
          <div style={modalContentStyle}>
            <h3 style={modalHeaderStyle}>Message</h3>
            <div style={{
              flex: 1,
              overflowY: 'auto',
              marginBottom: 16,
              paddingRight: 4,
              minHeight: 40,
              maxHeight: '45vh',
            }}>
              <p style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: 0 }}>{selectedMessage.message}</p>
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 8 }}>
              <button
                onClick={closeModal}
                style={{ ...actionButtonStyle, backgroundColor: "#6c757d" }}
                onMouseOver={e => e.target.style.backgroundColor = "#444"}
                onMouseOut={e => e.target.style.backgroundColor = "#6c757d"}
              >
                Close
              </button>
              <button
                onClick={handleDelete}
                style={{ ...actionButtonStyle, backgroundColor: "#dc3545" }}
                onMouseOver={e => e.target.style.backgroundColor = "#a71d2a"}
                onMouseOut={e => e.target.style.backgroundColor = "#dc3545"}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Responsive styles */}
      <style>{`
        @media (max-width: 700px) {
          div[style*='padding: 20px'] {
            padding: 0.5rem !important;
          }
          table {
            font-size: 13px !important;
          }
          th, td {
            padding: 6px !important;
          }
          div[style*='font-size: 1.5em'] {
            font-size: 1.2rem !important;
          }
        }
        @media (max-width: 500px) {
          table {
            min-width: 400px !important;
          }
        }
      `}</style>
    </div>
  );
};

export default AdminContact;
