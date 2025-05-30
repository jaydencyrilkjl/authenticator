import React, { useEffect, useState } from "react";

const Adsocial = () => {
  const [users, setUsers] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [notificationMessage, setNotificationMessage] = useState("");
  const [isMessagingEnabled, setIsMessagingEnabled] = useState(true);
  const [modalContent, setModalContent] = useState("");
  const [isModalVisible, setIsModalVisible] = useState(false);

  useEffect(() => {
    fetchUsers();
    fetchNotifications();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch("https://socialserver-377n.onrender.com/api/users");
      const users = await response.json();
      setUsers(users);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const deleteUser = async (userId) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    try {
      const response = await fetch(`https://socialserver-377n.onrender.com/api/admin/user/${userId}`, {
        method: "DELETE",
      });
      const result = await response.json();
      if (response.ok) {
        alert(result.message);
        fetchUsers();
      } else {
        alert("Error: " + result.message);
      }
    } catch (error) {
      console.error("Error deleting user:", error);
    }
  };

  const sendNotification = async () => {
    if (!notificationMessage.trim()) {
      alert("Please enter a notification message");
      return;
    }
    try {
      const response = await fetch("https://socialserver-377n.onrender.com/api/admin/notification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: notificationMessage }),
      });
      const result = await response.json();
      if (response.ok) {
        alert(result.message);
        setNotificationMessage("");
        fetchNotifications();
      } else {
        alert("Error: " + result.message);
      }
    } catch (error) {
      console.error("Error sending notification:", error);
    }
  };

  const fetchNotifications = async () => {
    try {
      const response = await fetch("https://socialserver-377n.onrender.com/api/admin/notifications");
      const notifications = await response.json();
      setNotifications(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  const deleteNotification = async (notificationId) => {
    if (!window.confirm("Are you sure you want to delete this notification?")) return;
    try {
      const response = await fetch(`https://socialserver-377n.onrender.com/api/admin/notification/${notificationId}`, {
        method: "DELETE",
      });
      const result = await response.json();
      if (response.ok) {
        alert(result.message);
        fetchNotifications();
      } else {
        alert("Error: " + result.message);
      }
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  };

  const toggleMessaging = async () => {
    try {
      const newState = !isMessagingEnabled;
      const response = await fetch("https://socialserver-377n.onrender.com/api/admin/toggle-messaging", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: newState }),
      });
      const result = await response.json();
      alert(result.message);
      setIsMessagingEnabled(newState);
    } catch (error) {
      console.error("Error toggling messaging:", error);
    }
  };

  const viewNotification = (message) => {
    setModalContent(message);
    setIsModalVisible(true);
  };

  const closeModal = () => {
    setIsModalVisible(false);
  };

  const backToAdminDashboard = () => {
    window.location.href = "/admindb"; // Redirect to admindb.js
  };

  return (
    <div style={{ fontFamily: "'Poppins', sans-serif", background: "#1f4037", color: "white", padding: "20px" }}>
      <div style={{ maxWidth: "800px", margin: "auto", background: "rgba(0, 0, 0, 0.5)", padding: "20px", borderRadius: "10px" }}>
        <h1 style={{ textAlign: "center" }}>Admin Panel</h1>
        <div>
          <h2 style={{ textAlign: "center", margin: "20px 0", fontSize: "24px", fontWeight: "bold" }}>GROUP AND CONTROL</h2>
          <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
            <button
              onClick={toggleMessaging}
              style={{
                background: "#00b894",
                color: "white",
                padding: "10px 15px",
                border: "none",
                borderRadius: "5px",
                cursor: "pointer",
              }}
            >
              {isMessagingEnabled ? "Disable Messaging" : "Enable Messaging"}
            </button>
            <button
              onClick={backToAdminDashboard}
              style={{
                background: "#e74c3c",
                color: "white",
                padding: "10px 15px",
                border: "none",
                borderRadius: "5px",
                cursor: "pointer",
              }}
            >
              Back
            </button>
          </div>
        </div>
        <div style={{ overflowX: "auto", marginBottom: "20px" }}>
          <h2>Users</h2>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "600px" }}>
            <thead>
              <tr>
                <th style={{ border: "1px solid #ddd", padding: "10px", textAlign: "left", background: "#333", color: "white" }}>Email</th>
                <th style={{ border: "1px solid #ddd", padding: "10px", textAlign: "left", background: "#333", color: "white" }}>Full Name</th>
                <th style={{ border: "1px solid #ddd", padding: "10px", textAlign: "left", background: "#333", color: "white" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user._id}>
                  <td style={{ border: "1px solid #ddd", padding: "10px" }}>{user.email}</td>
                  <td style={{ border: "1px solid #ddd", padding: "10px" }}>{user.fullName}</td>
                  <td style={{ border: "1px solid #ddd", padding: "10px" }}>
                    <button onClick={() => deleteUser(user._id)} style={{ background: "#e74c3c", padding: "8px 12px", border: "none", borderRadius: "5px", color: "white" }}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ marginBottom: "20px" }}>
          <h2>Send Notification</h2>
          <textarea
            value={notificationMessage}
            onChange={(e) => setNotificationMessage(e.target.value)}
            rows="3"
            placeholder="Enter notification message"
            style={{
              width: "95%",
              padding: "10px",
              marginBottom: "10px",
              borderRadius: "5px",
              border: "none",
            }}
          ></textarea>
          <button onClick={sendNotification} style={{ background: "#00b894", padding: "8px 12px", border: "none", borderRadius: "5px", color: "white" }}>
            Send Notification
          </button>
        </div>
        <div style={{ overflowX: "auto", marginBottom: "20px" }}>
          <h2>Notifications</h2>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "600px" }}>
            <thead>
              <tr>
                <th style={{ border: "1px solid #ddd", padding: "10px", textAlign: "left", background: "#333", color: "white" }}>Message</th>
                <th style={{ border: "1px solid #ddd", padding: "10px", textAlign: "left", background: "#333", color: "white" }}>Created At</th>
                <th style={{ border: "1px solid #ddd", padding: "10px", textAlign: "left", background: "#333", color: "white" }}>View</th>
                <th style={{ border: "1px solid #ddd", padding: "10px", textAlign: "left", background: "#333", color: "white" }}>Delete</th>
              </tr>
            </thead>
            <tbody>
              {notifications.map((notification) => (
                <tr key={notification._id}>
                  <td style={{ border: "1px solid #ddd", padding: "10px" }}>
                    {notification.message.length > 50 ? notification.message.substring(0, 50) + "..." : notification.message}
                  </td>
                  <td style={{ border: "1px solid #ddd", padding: "10px" }}>{new Date(notification.createdAt).toLocaleString()}</td>
                  <td style={{ border: "1px solid #ddd", padding: "10px" }}>
                    <button
                      onClick={() => viewNotification(notification.message)}
                      style={{ background: "#00b894", padding: "8px 12px", border: "none", borderRadius: "5px", color: "white" }}
                    >
                      View
                    </button>
                  </td>
                  <td style={{ border: "1px solid #ddd", padding: "10px" }}>
                    <button
                      onClick={() => deleteNotification(notification._id)}
                      style={{ background: "#e74c3c", padding: "8px 12px", border: "none", borderRadius: "5px", color: "white" }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {isModalVisible && (
        <div
          onClick={closeModal}
          style={{
            display: "flex",
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: "rgba(0, 0, 0, 0.85)",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 2000,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#1e272e",
              color: "#d2dae2",
              padding: "30px",
              borderRadius: "8px",
              width: "450px",
              maxWidth: "90%",
              textAlign: "center",
              boxShadow: "0 8px 20px rgba(0, 0, 0, 0.5)",
            }}
          >
            <h3 style={{ marginBottom: "15px", fontSize: "22px", fontWeight: "600", color: "#1abc9c" }}>Notification</h3>
            <p style={{ marginBottom: "25px", fontSize: "16px", lineHeight: "1.6", color: "#dfe6e9" }}>{modalContent}</p>
            <button
              onClick={closeModal}
              style={{
                background: "#636e72",
                color: "white",
                padding: "8px 8px",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "12px",
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

export default Adsocial;
