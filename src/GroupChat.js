import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client'; // Import io from socket.io-client
import StyledAlert from './components/StyledAlert'; // Import StyledAlert

const GroupChat = () => {
  const [messages, setMessages] = useState([]);
  const [chatMessage, setChatMessage] = useState('');
  const [chatImage, setChatImage] = useState(null);
  const [isMessagingEnabled, setIsMessagingEnabled] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [alertMessage, setAlertMessage] = useState(""); // State for alert message
  const [alertCallback, setAlertCallback] = useState(null); // Callback for alert actions
  const chatMessagesContainerRef = useRef(null);
  const loggedInUser = localStorage.getItem('userId');
  const socket = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  useEffect(() => {
    if (!loggedInUser) {
      window.location.href = 'login.html';
    }

    socket.current = io('https://socialserver-377n.onrender.com');
    socket.current.on('groupMessage', (message) => {
      appendMessage(message);
    });

    fetchGroupMessages();
    checkMessagingState();

    return () => {
      socket.current.disconnect();
    };
  }, [loggedInUser]); // Add loggedInUser to the dependency array

  const fetchGroupMessages = async () => {
    try {
      const response = await fetch('https://socialserver-377n.onrender.com/api/messages/group');
      const data = await response.json();
      if (response.ok && data.messages) {
        setMessages(data.messages);
      } else {
        setMessages([]);
      }
    } catch (error) {
      console.error('Error fetching group messages:', error.message);
    }
  };

  const appendMessage = (message) => {
    setMessages((prevMessages) => [...prevMessages, message]);
    if (chatMessagesContainerRef.current) {
      chatMessagesContainerRef.current.scrollTop = chatMessagesContainerRef.current.scrollHeight;
    }
  };

  const checkMessagingState = async () => {
    try {
      const response = await fetch('https://socialserver-377n.onrender.com/api/admin/messaging-state');
      const result = await response.json();
      setIsMessagingEnabled(result.enabled);
      if (!result.enabled) {
        setAlertMessage("Messaging is currently disabled by the admin."); // Set alert message
      }
    } catch (error) {
      console.error('Error checking messaging state:', error);
    }
  };

  const handleChatFormSubmit = async (e) => {
    e.preventDefault();
    if (!isMessagingEnabled) {
      setAlertMessage("Messaging is currently disabled by the admin."); // Set alert message
      return;
    }

    if (!chatMessage.trim() && !chatImage) return;

    const formData = new FormData();
    formData.append('sender', loggedInUser);
    if (chatMessage.trim()) formData.append('text', chatMessage.trim());
    if (chatImage) formData.append('image', chatImage);

    try {
      const response = await fetch('https://socialserver-377n.onrender.com/api/messages/group', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      setChatMessage('');
      setChatImage(null);
      fetchGroupMessages();
    } catch (error) {
      console.error('Error sending message:', error.message);
    }
  };

  const handleDeleteMessage = async (messageId) => {
    try {
      const response = await fetch(`https://socialserver-377n.onrender.com/api/messages/group/${messageId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: loggedInUser }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete message');
      }

      setMessages((prevMessages) => prevMessages.filter((msg) => msg._id !== messageId));
    } catch (error) {
      console.error('Error deleting message:', error.message);
    }
  };

  const handleRecordVoiceNote = async () => {
    if (!isRecording) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: 'audio/webm' });

        audioChunksRef.current = []; // Clear chunks before recording starts

        mediaRecorderRef.current.ondataavailable = (event) => {
          audioChunksRef.current.push(event.data);
        };

        mediaRecorderRef.current.onstop = async () => {
          try {
            const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
            audioChunksRef.current = []; // Reset after recording stops

            const formData = new FormData();
            formData.append('sender', loggedInUser);
            formData.append('audio', audioBlob);

            const response = await fetch('https://socialserver-377n.onrender.com/api/messages/group', {
              method: 'POST',
              body: formData,
            });

            if (!response.ok) {
              const errorData = await response.json();
              console.error('Server error:', errorData);
              throw new Error('Failed to send voice note');
            }

            fetchGroupMessages(); // Refresh messages after sending
          } catch (error) {
            console.error('Error sending voice note:', error.message);
          } finally {
            // Stop all tracks to close the microphone
            mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
          }
        };

        mediaRecorderRef.current.start();
        setIsRecording(true);
      } catch (error) {
        console.error('Error accessing microphone:', error.message);
      }
    } else {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleFileChange = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    const formData = new FormData();
    formData.append('sender', loggedInUser);
    formData.append('image', selectedFile);

    try {
      const response = await fetch('https://socialserver-377n.onrender.com/api/messages/group', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to send image');
      }

      setChatImage(null); // Clear the selected image
      fetchGroupMessages(); // Refresh messages after sending
    } catch (error) {
      console.error('Error sending image:', error.message);
    }
  };

  const goBack = () => {
    window.location.href = '/sdb'; // Redirect to Sdb.js
  };

  useEffect(() => {
    if (chatMessagesContainerRef.current) {
      chatMessagesContainerRef.current.scrollTop = chatMessagesContainerRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div style={styles.chatContainer}>
      {/* StyledAlert */}
      {alertMessage && (
        <StyledAlert
          message={alertMessage}
          onClose={() => {
            setAlertMessage(""); // Clear alert
            setAlertCallback(null);
          }}
          onConfirm={alertCallback} // Execute callback if confirmed
        />
      )}
      <header style={styles.header}>
        <h2 style={styles.headerTitle}>Social Community</h2>
        <button style={styles.backButton} onClick={goBack}>
          Back
        </button>
      </header>
      <div id="chatMessagesContainer" style={styles.chatMessagesContainer} ref={chatMessagesContainerRef}>
        {messages.length > 0 ? (
          messages.map((message) => (
            <div key={message._id} style={styles.message}>
              <div style={styles.messageHeader}>
                <strong style={styles.messageSender}>
                  {message.sender?.fullName || "Unknown User"} ({message.sender?.email || "Unknown Email"})
                </strong>
                {message.sender?._id === loggedInUser && (
                  <button style={styles.deleteButton} onClick={() => handleDeleteMessage(message._id)}>
                    Delete
                  </button>
                )}
              </div>
              {message.text && <p style={styles.messageText}>{message.text}</p>}
              {message.image && (
                <img
                  src={`https://socialserver-377n.onrender.com${message.image}`}
                  alt="User uploaded content"
                  style={styles.messageImage}
                />
              )}
              {message.audio && (
                <div style={styles.voiceNote}>
                  <i
                    className="fas fa-play-circle"
                    style={styles.voiceNotePlayIcon}
                  ></i>
                  <audio controls style={styles.voiceNoteAudio}>
                    <source src={`https://socialserver-377n.onrender.com${message.audio}`} type="audio/webm" />
                    Your browser does not support the audio element.
                  </audio>
                </div>
              )}
            </div>
          ))
        ) : (
          <div style={styles.noMessages}>No messages yet</div>
        )}
      </div>
      <form style={styles.form} onSubmit={handleChatFormSubmit}>
        <input
          type="text"
          name="chatMessage"
          placeholder="Type your message..."
          value={chatMessage}
          onChange={(e) => setChatMessage(e.target.value)}
          style={styles.input}
        />
        <div style={styles.fileInputContainer}>
          <input
            type="file"
            name="chatImage"
            accept="image/*"
            onChange={handleFileChange}
            style={styles.fileInput}
          />
          <button
            type="button"
            style={styles.uploadButton}
            onClick={() => document.querySelector('input[name="chatImage"]').click()}
          >
            Upload Image
          </button>
        </div>
        <button
          type="button"
          id="recordVoiceNote"
          onClick={handleRecordVoiceNote}
          style={styles.recordButton}
        >
          {isRecording ? 'Stop 🎤' : '🎤'}
        </button>
        <button type="submit" style={styles.sendButton}>
          Send
        </button>
      </form>
    </div>
  );
};

const styles = {
  chatContainer: {
    height: '100vh',
    width: '100vw',
    margin: '0',
    padding: '10px',
    background: '#1f4037',
    color: 'white',
    fontFamily: "'Poppins', sans-serif",
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  header: {
    width: '100%',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px',
    padding: '0 10px',
  },
  chatMessagesContainer: {
    width: '100%',
    background: 'rgba(0,0,0,0.2)',
    padding: '10px',
    maxHeight: '60vh',
    overflowY: 'auto',
    borderRadius: '5px',
    marginBottom: '10px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.2)',
  },
  message: {
    marginBottom: '10px',
    padding: '5px',
    borderBottom: '1px solid rgba(255,255,255,0.2)',
  },
  messageHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  messageSender: {
    fontSize: '0.9em',
    color: '#ccc',
  },
  deleteButton: {
    background: '#e74c3c',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    padding: '5px 10px',
    cursor: 'pointer',
    fontSize: '0.8em',
  },
  messageText: {
    fontSize: '1.2em',
    fontWeight: 'bold',
    margin: '5px 0',
    color: 'white',
  },
  messageImage: {
    maxWidth: '200px',
    borderRadius: '5px',
    marginTop: '5px',
  },
  voiceNote: {
    display: 'flex',
    alignItems: 'center',
    background: 'rgba(0, 0, 0, 0.3)', // Slimmer background
    padding: '5px 10px', // Reduced padding
    borderRadius: '5px', // Smaller border radius
    marginTop: '5px',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)', // Subtle shadow
  },
  voiceNoteAudio: {
    flex: 1,
    outline: 'none',
    border: 'none',
    height: '25px', // Slimmer height
    background: 'transparent',
  },
  voiceNotePlayIcon: {
    fontSize: '1.2em',
    color: '#07a85d',
    marginRight: '10px',
    cursor: 'pointer',
  },
  noMessages: {
    textAlign: 'center',
    color: '#ccc',
  },
  form: {
    width: '100%',
    display: 'flex',
    alignItems: 'center', // Align items vertically
    gap: '10px',
    justifyContent: 'space-between',
  },
  input: {
    flex: '1',
    padding: '10px',
    border: '1px solid #ccc',
    borderRadius: '5px',
    fontSize: '1em',
    height: '40px',
    maxWidth: '25%', // Ensure equal length
  },
  fileInputContainer: {
    display: 'flex',
    alignItems: 'center',
    maxWidth: '25%', // Ensure equal length
  },
  fileInput: {
    display: 'none',
  },
  uploadButton: {
    width: '100%', // Equal length
    height: '40px',
    background: '#007bff',
    border: 'none',
    borderRadius: '5px',
    color: 'white',
    cursor: 'pointer',
    fontSize: '1em',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordButton: {
    width: '100%', // Equal length
    height: '40px',
    background: '#ff9800',
    border: 'none',
    borderRadius: '5px',
    color: 'white',
    cursor: 'pointer',
    fontSize: '1em',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    maxWidth: '25%', // Ensure equal length
  },
  sendButton: {
    width: '100%', // Equal length
    height: '40px',
    background: '#07a85d',
    border: 'none',
    borderRadius: '5px',
    color: 'white',
    cursor: 'pointer',
    fontSize: '1em',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    maxWidth: '25%', // Ensure equal length
  },
  backButton: {
    padding: '10px 15px',
    background: '#007bff', // Blue background
    border: 'none',
    borderRadius: '5px',
    color: 'white',
    cursor: 'pointer',
    fontSize: '1em',
    fontWeight: 'bold',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.2)', // Add shadow for depth
    transition: 'background 0.3s ease, transform 0.2s',
  },
  backButtonHover: {
    background: '#0056b3', // Darker blue on hover
    transform: 'translateY(-2px)', // Slight lift on hover
  },
};

export default GroupChat;
