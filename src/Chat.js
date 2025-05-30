import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { io } from 'socket.io-client';
import StyledAlert from './components/StyledAlert'; // Import StyledAlert

const Chat = () => {
  const loggedInUser = localStorage.getItem('userId');
  const chatPartner = new URLSearchParams(window.location.search).get('partnerId');
  const [messages, setMessages] = useState([]);
  const [partnerEmail, setPartnerEmail] = useState('Chat');
  const [currentReply, setCurrentReply] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const imageInputRef = useRef(null); // Ref for file input
  const socket = useMemo(() => io('https://socialserver-377n.onrender.com'), []); // Memoized socket
  const [isSending, setIsSending] = useState(false); // Track sending state
  const [alertMessage, setAlertMessage] = useState(""); // State for alert message
  const [alertCallback, setAlertCallback] = useState(null); // Callback for alert actions
  const audioChunksRef = useRef([]); // Ref for audio chunks

  const fetchPartnerInfo = useCallback(async () => {
    try {
      const response = await fetch('https://socialserver-377n.onrender.com/api/users');
      const users = await response.json();
      const partner = users.find((u) => u._id === chatPartner);
      setPartnerEmail(partner ? partner.email : 'Chat');
    } catch {
      setPartnerEmail('Chat');
    }
  }, [chatPartner]);

  const fetchChatMessages = useCallback(async () => {
    try {
      const response = await fetch(
        `https://socialserver-377n.onrender.com/api/messages/conversation/${loggedInUser}/${chatPartner}`
      );
      const conversation = await response.json();
      setMessages(Array.isArray(conversation) ? conversation : []);
    } catch (error) {
      console.error('Error fetching chat messages:', error);
      setMessages([]);
    }
  }, [loggedInUser, chatPartner]);

  useEffect(() => {
    if (!loggedInUser) {
      window.location.href = 'login.html';
    } else {
      fetchPartnerInfo();
      fetchChatMessages();
    }

    // Listen for new messages in real-time
    socket.on('newMessage', (message) => {
      if (
        (message.sender._id === loggedInUser && message.receiver === chatPartner) ||
        (message.sender._id === chatPartner && message.receiver === loggedInUser)
      ) {
        setMessages((prevMessages) => [...prevMessages, message]);
      }
    });

    // Periodically fetch messages to ensure no missed updates
    const intervalId = setInterval(fetchChatMessages, 5000);

    return () => {
      clearInterval(intervalId); // Clear interval on component unmount
      socket.disconnect();
    };
  }, [loggedInUser, chatPartner, fetchPartnerInfo, fetchChatMessages, socket]);

  useEffect(() => {
    const container = document.getElementById('chatMessagesContainer');
    if (container) container.scrollTop = container.scrollHeight; // Scroll to latest message
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (isSending) return; // Prevent multiple clicks
    setIsSending(true);

    const messageInput = e.target.elements.chatMessage;
    const messageText = messageInput.value.trim();

    if (!messageText && !currentReply) {
      setIsSending(false);
      return;
    }

    const formData = new FormData();
    formData.append('sender', loggedInUser);
    formData.append('receiver', chatPartner);
    formData.append('text', messageText);
    if (currentReply?.id) formData.append('replyTo', currentReply.id);

    try {
      await fetch('https://socialserver-377n.onrender.com/api/messages', {
        method: 'POST',
        body: formData,
      });
      messageInput.value = '';
      setCurrentReply(null);
      fetchChatMessages();
    } catch (error) {
      console.error('Error sending message:', error.message);
    } finally {
      setIsSending(false);
    }
  };

  const handleRecordVoiceNote = async () => {
    if (!isRecording) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
        setMediaRecorder(recorder);
  
        audioChunksRef.current = []; // Clear chunks before recording starts
  
        recorder.ondataavailable = (event) => {
          audioChunksRef.current.push(event.data); // Use ref to store chunks
        };
  
        recorder.onstop = async () => {
          try {
            const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
            console.log('Audio Blob:', audioBlob); // Check the Blob data
  
            audioChunksRef.current = []; // Reset ref after recording stops
  
            const formData = new FormData();
            formData.append('sender', loggedInUser);
            formData.append('receiver', chatPartner);
            formData.append('audio', audioBlob);
  
            const response = await fetch('https://socialserver-377n.onrender.com/api/messages', {
              method: 'POST',
              body: formData,
            });
  
            console.log('Server Response:', response); // Check server response
  
            if (!response.ok) {
              const errorData = await response.json();
              console.error('Server error:', errorData);
              throw new Error('Failed to send voice message');
            }
  
            fetchChatMessages(); // Refresh chat messages
          } catch (error) {
            console.error('Error sending voice message:', error.message);
          } finally {
            // Stop all tracks to close the microphone
            recorder.stream.getTracks().forEach((track) => track.stop());
          }
        };
  
        recorder.start();
        setIsRecording(true);
        document.getElementById('recordVoiceNote').textContent = 'Stop 🎤';
      } catch (error) {
        console.error('Error accessing microphone:', error.message);
      }
    } else {
      mediaRecorder.stop();
      setIsRecording(false);
      document.getElementById('recordVoiceNote').textContent = '🎤';
    }
  };
  

  const handleFileUpload = async (e) => {
    const chatImage = e.target.files[0];
    if (!chatImage) return;

    const formData = new FormData();
    formData.append('sender', loggedInUser);
    formData.append('receiver', chatPartner);
    formData.append('image', chatImage);

    try {
      await fetch('https://socialserver-377n.onrender.com/api/messages', {
        method: 'POST',
        body: formData,
      });
      fetchChatMessages(); // Refresh chat messages
    } catch (error) {
      console.error('Error sending image:', error.message);
    }
  };

  const handleEditMessage = async (messageId, currentText) => {
    const newText = prompt('Edit your message:', currentText); // Retain prompt for editing
    if (!newText || newText.trim() === '' || newText === currentText) return;

    try {
      await fetch(`https://socialserver-377n.onrender.com/api/messages/update/${messageId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: newText }),
      });
      fetchChatMessages();
    } catch (error) {
      console.error('Error updating message:', error.message);
    }
  };

  const handleDeleteMessage = async (messageId) => {
    try {
      await fetch(`https://socialserver-377n.onrender.com/api/messages/delete/${messageId}`, {
        method: 'DELETE',
      });
      fetchChatMessages();
    } catch (error) {
      console.error('Error deleting message:', error.message);
    }
  };

  const handleReplyToMessage = (message) => {
    setCurrentReply({ id: message._id, text: message.text });
  };

  const cancelReply = () => {
    setCurrentReply(null);
  };

  const showFullImage = (imagePath) => {
    const modal = document.createElement('div');
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100%';
    modal.style.height = '100%';
    modal.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    modal.style.display = 'flex';
    modal.style.justifyContent = 'center';
    modal.style.alignItems = 'center';
    modal.style.zIndex = '1000';

    const fullImage = document.createElement('img');
    fullImage.src = imagePath;
    fullImage.style.maxWidth = '90%';
    fullImage.style.maxHeight = '90%';
    fullImage.style.borderRadius = '5px';

    modal.appendChild(fullImage);

    modal.addEventListener('click', () => {
      document.body.removeChild(modal);
    });

    document.body.appendChild(modal);
  };

  const goBack = () => {
    window.location.href = '/sdb'; // Redirect to Sdb.js
  };

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
      <div style={styles.chatWrapper}>
        <header style={styles.header}>
          <h2 style={styles.headerTitle}>{partnerEmail}</h2>
          <button onClick={goBack} style={styles.backButton}>
            Back
          </button>
        </header>
        <div id="chatMessagesContainer" style={styles.chatMessagesContainer}>
          {messages.map((message) => (
            <div
              key={message._id}
              className={message.sender._id === loggedInUser ? 'sentMessage' : 'receivedMessage'}
              style={message.sender._id === loggedInUser ? styles.sentMessage : styles.receivedMessage}
            >
              {message.replyTo && (
                <div style={styles.replyText}>Replying to: {message.replyTo.text}</div>
              )}
              {message.text && <p style={styles.messageText}>{message.text}</p>}
              {message.image && (
                <img
                  src={`https://socialserver-377n.onrender.com${message.image}`}
                  alt="Sent"
                  style={styles.messageImage}
                  onClick={() => showFullImage(`https://socialserver-377n.onrender.com${message.image}`)}
                />
              )}
              {message.audio && (
                <div style={styles.voiceNote}>
                  <audio controls style={styles.audio}>
                    <source
                      src={`https://socialserver-377n.onrender.com${message.audio}`} // Fixed audio path
                      type="audio/mpeg" // Ensure MP3 MIME type
                    />
                    Your browser does not support the audio element.
                  </audio>
                </div>
              )}
              <small>{new Date(message.createdAt).toLocaleString()}</small>
              <div
                style={{
                  ...styles.messageActions,
                  justifyContent:
                    message.sender._id === loggedInUser ? 'flex-start' : 'flex-end',
                }}
              >
                {message.sender._id === loggedInUser ? (
                  <>
                    <button
                      onClick={() => handleEditMessage(message._id, message.text)}
                      style={styles.messageBtn}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteMessage(message._id)}
                      style={styles.messageBtn}
                    >
                      Delete
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => handleReplyToMessage(message)}
                    style={styles.messageBtn}
                  >
                    Reply
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
        {currentReply && (
          <div id="replyPreview" style={styles.replyPreview}>
            <span>Replying to: {currentReply.text}</span>
            <button onClick={cancelReply} style={styles.replyCancelBtn}>
              X
            </button>
          </div>
        )}
        <form onSubmit={handleSendMessage} style={styles.form}>
          <input
            type="text"
            name="chatMessage"
            placeholder="Type your message..."
            style={styles.input}
          />
          <div style={styles.fileInputContainer}>
            <input
              ref={imageInputRef} // Use ref for file input
              type="file"
              name="chatImage"
              accept="image/*"
              onChange={handleFileUpload}
              style={styles.fileInput}
            />
            <button
              type="button"
              onClick={() => imageInputRef.current.click()} // Trigger file input via ref
              style={styles.uploadButton}
            >
              📷
            </button>
          </div>
          <button
            id="recordVoiceNote"
            type="button"
            onClick={handleRecordVoiceNote}
            style={styles.recordVoiceNote}
          >
            {isRecording ? 'Stop 🎤' : '🎤'}
          </button>
          <button type="submit" style={styles.sendButton} disabled={isSending}>
            {isSending ? 'Sending...' : 'Send'}
          </button>
        </form>
      </div>
    </div>
  );
};

const styles = {
  chatContainer: {
    background: '#1f4037', // Dark greenish-teal background
    color: '#e0e0e0', // Light gray text for contrast
    fontFamily: 'Arial, sans-serif',
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    padding: '10px',
  },
  chatWrapper: {
    maxWidth: '100%',
    margin: 'auto',
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    borderRadius: '10px',
    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.5)',
    background: '#2a5248', // Slightly lighter greenish-teal for the container
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 15px',
    borderBottom: '1px solid #333',
    background: '#2a2a2a', // Header background
    borderTopLeftRadius: '10px',
    borderTopRightRadius: '10px',
  },
  headerTitle: {
    fontSize: '1.2em',
    fontWeight: 'bold',
    color: '#ffffff',
    textTransform: 'capitalize',
  },
  backButton: {
    padding: '8px 12px',
    background: '#1abc9c', // Lighter green color, same as the send button
    border: 'none',
    borderRadius: '5px',
    color: '#ffffff',
    cursor: 'pointer',
    fontSize: '0.9em',
    transition: 'background 0.3s ease',
  },
  chatMessagesContainer: {
    flex: 1,
    padding: '10px',
    overflowY: 'auto',
    background: '#0d261b', // Very dark green background
    borderBottom: '1px solid #333',
    borderRadius: '10px',
    display: 'flex',
    flexDirection: 'column',
  },
  sentMessage: {
    alignSelf: 'flex-end', // Align to the right
    background: '#1abc9c', // Lighter green color, same as the send button
    color: '#ffffff',
    padding: '10px 15px',
    borderRadius: '15px 15px 0 15px',
    marginBottom: '10px',
    maxWidth: '70%',
    wordWrap: 'break-word',
    boxShadow: '0 2px 5px rgba(0, 0, 0, 0.2)',
    textAlign: 'right', // Align text to the right
    marginLeft: 'auto', // Push to the right
  },
  receivedMessage: {
    alignSelf: 'flex-start', // Align to the left
    background: '#333',
    color: '#e0e0e0',
    padding: '10px 15px',
    borderRadius: '15px 15px 15px 0',
    marginBottom: '10px',
    maxWidth: '70%',
    wordWrap: 'break-word',
    boxShadow: '0 2px 5px rgba(0, 0, 0, 0.2)',
    textAlign: 'left', // Align text to the left
    marginRight: 'auto', // Push to the left
  },
  messageText: {
    fontSize: '1em', // Slightly larger font size
    fontWeight: 'bold', // Make the text bold
    color: '#ffffff', // White text color
    textShadow: '1px 1px 2px rgba(0, 0, 0, 0.8)', // Add shadow for a solid look
    lineHeight: '1.5', // Improve readability
    margin: '5px 0', // Add spacing around the text
    background: 'rgba(0, 0, 0, 0.6)', // Dark background for contrast
    padding: '10px', // Add padding for better readability
    borderRadius: '8px', // Rounded corners
  },
  replyText: {
    fontSize: '0.85em', // Smaller font size
    fontWeight: '300', // Slim font weight
    fontStyle: 'italic', // Italicize the text
    color: '#cccccc', // Light gray color
    marginBottom: '5px', // Add spacing below
    background: 'rgba(255, 255, 255, 0.1)', // Subtle background for contrast
    padding: '5px 10px', // Add padding for better readability
    borderRadius: '5px', // Rounded corners
  },
  messageImage: {
    maxWidth: '100%',
    borderRadius: '10px',
    marginTop: '10px',
    cursor: 'pointer',
  },
  voiceNote: {
    marginTop: '10px',
    display: 'flex',
    alignItems: 'center',
    background: '#444',
    padding: '5px',
    borderRadius: '5px',
    boxShadow: '0 2px 5px rgba(0, 0, 0, 0.2)',
  },
  audio: {
    width: '100%',
    height: '30px',
    outline: 'none',
  },
  messageActions: {
    marginTop: '5px',
    display: 'flex',
    gap: '10px',
    justifyContent: 'flex-end', // Align actions to the right for sent messages
  },
  messageBtn: {
    padding: '5px 10px',
    background: '#444',
    border: 'none',
    borderRadius: '5px',
    color: '#ffffff',
    fontSize: '0.8em',
    cursor: 'pointer',
    transition: 'background 0.3s ease',
  },
  messageBtnHover: {
    background: '#555', // Slightly lighter background on hover
  },
  form: {
    display: 'flex',
    alignItems: 'center',
    gap: '5px', // Reduced gap between elements
    padding: '10px',
    background: '#2a2a2a',
    borderBottomLeftRadius: '10px',
    borderBottomRightRadius: '10px',
  },
  input: {
    flex: '2', // Adjusted width
    padding: '8px',
    borderRadius: '5px',
    border: '1px solid #444',
    background: '#1e1e1e',
    color: '#e0e0e0',
    fontSize: '0.9em',
  },
  fileInputContainer: {
    flex: '0 0 auto',
    display: 'flex',
    alignItems: 'center',
  },
  fileInput: {
    display: 'none',
  },
  uploadButton: {
    padding: '8px',
    background: '#007bff',
    border: 'none',
    borderRadius: '5px',
    color: '#ffffff',
    cursor: 'pointer',
    fontSize: '0.9em',
  },
  recordVoiceNote: {
    flex: '0 0 auto',
    padding: '8px',
    background: '#ff9800',
    border: 'none',
    borderRadius: '5px',
    color: '#ffffff',
    cursor: 'pointer',
    fontSize: '0.9em',
  },
  sendButton: {
    flex: '0 0 auto',
    padding: '8px',
    background: '#1abc9c',
    border: 'none',
    borderRadius: '5px',
    color: '#ffffff',
    cursor: 'pointer',
    fontSize: '0.9em',
  },
  '@media (max-width: 768px)': {
    headerTitle: {
      fontSize: '1em',
    },
    sentMessage: {
      maxWidth: '90%',
    },
    receivedMessage: {
      maxWidth: '90%',
    },
    input: {
      fontSize: '0.8em',
    },
    sendButton: {
      fontSize: '0.8em',
    },
    recordVoiceNote: {
      fontSize: '0.8em',
    },
  }, // Add this closing brace
};

export default Chat;
