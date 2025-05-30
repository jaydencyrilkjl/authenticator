import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom'; // Add this import
import StyledAlert from './components/StyledAlert'; // Import StyledAlert
import { io } from 'socket.io-client'; // Import Socket.IO client

const socket = io('https://socialserver-377n.onrender.com'); // Initialize Socket.IO client

const Sdb = () => {
  const togglePostOptions = (postId) => {
    setVisibleOptions((prev) => ({
      ...prev,
      [postId]: !prev[postId],
    }));
  };
  const [activeSection, setActiveSection] = useState('home');
  const [showSidebar, setShowSidebar] = useState(false);
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [friends, setFriends] = useState([]);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [updateEmailModalVisible, setUpdateEmailModalVisible] = useState(false);
  const [notificationModal, setNotificationModal] = useState({ visible: false, message: '' });
  const [postText, setPostText] = useState('');
  const [postImage, setPostImage] = useState(null);
  const [confirmModal, setConfirmModal] = useState({ visible: false, onConfirm: null, message: '' });
  const [visibleOptions, setVisibleOptions] = useState({}); // Track visibility of options for each post
  const [conversations, setConversations] = useState([]); // State to store conversations
  const [updateEmailStep, setUpdateEmailStep] = useState(1); // Track the current step in the modal
  const [verificationCode, setVerificationCode] = useState(''); // Store the generated verification code
  const [alertMessage, setAlertMessage] = useState(''); // State for alert message
  const [alertCallback, setAlertCallback] = useState(null); // Callback for alert actions
  const [fullImage, setFullImage] = useState(null); // State to store the full image URL
  const [editPostModal, setEditPostModal] = useState({ visible: false, postId: null, currentText: '' }); // State for edit post modal

  const userId = localStorage.getItem('userId');
  const navigate = useNavigate(); // Initialize the navigate function

  const fetchProfile = useCallback(async () => {
    const profileId = localStorage.getItem('viewProfileId') || userId;
    if (!profileId) return;
    try {
      const response = await fetch(`https://socialserver-377n.onrender.com/api/profile/${profileId}`);
      if (!response.ok) throw new Error('Failed to fetch profile');
      const data = await response.json();
      setProfile(data);
    } catch (error) {
      console.error(error);
    }
  }, [userId]);

  const fetchFriends = useCallback(async () => {
    try {
      const response = await fetch('https://socialserver-377n.onrender.com/api/users');
      if (!response.ok) throw new Error('Failed to fetch friends');
      const data = await response.json();
      setFriends(data.filter(user => user._id !== userId));
    } catch (error) {
      console.error(error);
    }
  }, [userId]); // Memoize fetchFriends with useCallback

  const fetchConversations = useCallback(async () => {
    try {
      const response = await fetch(`https://socialserver-377n.onrender.com/api/messages/conversations/${userId}`);
      if (!response.ok) throw new Error('Failed to fetch conversations');
      const partners = await response.json();
      setConversations(partners); // Update state with fetched conversations
    } catch (error) {
      console.error('Error fetching conversations:', error);
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) {
      window.location.href = "/Slogin";
    } else {
      const savedSection = localStorage.getItem('activeSection') || 'home';
      setActiveSection(savedSection);
      fetchPosts();
      fetchProfile();
    }
  }, [fetchProfile, userId]);

  useEffect(() => {
    if (activeSection === 'friends') {
      fetchFriends(); // Automatically fetch friends when the friends section is active
    }
    if (activeSection === 'messages') {
      fetchConversations(); // Automatically fetch messages when the messages section is active
    }
  }, [activeSection, fetchFriends, fetchConversations]); // Include fetchConversations in the dependency array

  // Always fetch notifications as long as notifications section is open
  useEffect(() => {
    let intervalId;
    if (activeSection === 'notifications') {
      fetchNotifications(); // Initial fetch
      intervalId = setInterval(fetchNotifications, 5000); // Poll every 5 seconds
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [activeSection]);

  useEffect(() => {
    socket.on('newPost', (post) => {
      setPosts((prevPosts) => [post, ...prevPosts]); // Prepend the new post to the list
    });

    return () => {
      socket.off('newPost'); // Clean up the event listener
    };
  }, []);

  const toggleSidebar = () => {
    setShowSidebar((prev) => !prev); // Toggle the sidebar visibility
  };

  const handleSectionChange = (section) => {
    setActiveSection(section);
    localStorage.setItem('activeSection', section);
    setShowSidebar(false); // Close the sidebar when a button is clicked
    if (section === 'friends') fetchFriends();
    if (section === 'notifications') fetchNotifications();
    if (section === 'messages') fetchConversations(); // Fetch messages when the section is opened
    if (section === 'settings') navigate('/Set'); // Redirect to Set.js
  };

  const fetchPosts = async () => {
    try {
      const response = await fetch('https://socialserver-377n.onrender.com/api/posts');
      if (!response.ok) throw new Error('Failed to fetch posts');
      const data = await response.json();

      // Update posts without comments
      const updatedPosts = data.map(post => ({
        ...post,
        reactions: post.reactions || { love: [], like: [], dislike: [], hate: [] },
      }));

      setPosts(updatedPosts); // Update posts with reactions only
    } catch (error) {
      console.error('Error fetching posts:', error);
      setAlertMessage('Error fetching posts.');
    }
  };

  const fetchNotifications = async () => {
    try {
      const response = await fetch('https://socialserver-377n.onrender.com/api/admin/notifications');
      if (!response.ok) throw new Error('Failed to fetch notifications');
      const data = await response.json();
      setNotifications(data);
    } catch (error) {
      console.error(error);
    }
  };

  const startChat = (friendId) => {
    navigate(`/chat?partnerId=${friendId}`); // Redirect to Chat.js with the partnerId as a query parameter
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/Slogin'); // Redirect to Slogin.js
  };

  const handleDeleteAccount = async (reason) => {
    try {
      const response = await fetch('https://socialserver-377n.onrender.com/api/profile/deleteAccountRequest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user: userId, reason }),
      });
      const data = await response.json();
      if (response.ok) {
        setAlertMessage(data.message); // Set alert message
        setDeleteModalVisible(false);
      } else {
        setAlertMessage(data.message); // Set alert message
      }
    } catch (error) {
      console.error(error);
      setAlertMessage('Error sending your deletion request.'); // Set alert message
    }
  };

  const sendVerificationCode = async () => {
    try {
      const generatedCode = Math.random().toString(36).substring(2, 8).toUpperCase(); // Generate a 6-character alphanumeric code
      setVerificationCode(generatedCode);

      // Simulate sending the code to the user's email
      console.log(`Verification code sent to user's email: ${generatedCode}`);
      setAlertMessage('Verification code sent to your email.'); // Set alert message

      setUpdateEmailStep(2); // Move to the verification step
    } catch (error) {
      console.error('Error sending verification code:', error);
      setAlertMessage('Failed to send verification code.'); // Set alert message
    }
  };

  const verifyCode = (inputCode) => {
    if (inputCode === verificationCode) {
      setAlertMessage('Code verified successfully.'); // Set alert message
      setUpdateEmailStep(3); // Move to the new email input step
    } else {
      setAlertMessage('Invalid verification code. Please try again.'); // Set alert message
    }
  };

  const submitNewEmail = async (newEmail) => {
    try {
      const userId = localStorage.getItem('userId');
      const response = await fetch('https://socialserver-377n.onrender.com/api/profile/submitEmailUpdate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user: userId, newEmail }),
      });
      const data = await response.json();
      if (response.ok) {
        setAlertMessage('Email updated successfully.'); // Set alert message
        setUpdateEmailModalVisible(false); // Close the modal
      } else {
        setAlertMessage(`Error: ${data.message}`); // Set alert message
      }
    } catch (error) {
      console.error('Error submitting new email:', error);
      setAlertMessage('Failed to update email.'); // Set alert message
    }
  };
  const handlePostSubmit = async (e) => {
    e.preventDefault();
    if (!postText && !postImage) {
      setAlertMessage('Please enter text or select an image to post.'); // Set alert message
      return;
    }

    const formData = new FormData();
    formData.append('user', userId);
    if (postText) formData.append('text', postText);
    if (postImage) formData.append('image', postImage);

    try {
      const response = await fetch('https://socialserver-377n.onrender.com/api/posts', {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) throw new Error('Failed to create post');
      await fetchPosts(); // Fetch the latest posts to ensure the new post is fully loaded
      setPostText(''); // Clear the text input
      setPostImage(null); // Clear the image input
    } catch (error) {
      console.error(error);
      setAlertMessage('Error creating post.'); // Set alert message
    }
  };

  const handleEditPost = async (postId, currentText) => {
    openEditPostModal(postId, currentText);
  };

  const openEditPostModal = (postId, currentText) => {
    setEditPostModal({ visible: true, postId, currentText });
  };

  const closeEditPostModal = () => {
    setEditPostModal({ visible: false, postId: null, currentText: '' });
  };

  const handleEditPostSubmit = async () => {
    if (!editPostModal.currentText.trim()) {
      setAlertMessage('Post text cannot be empty.'); // Set alert message
      return;
    }

    try {
      const response = await fetch(`https://socialserver-377n.onrender.com/api/posts/${editPostModal.postId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user: userId, text: editPostModal.currentText }),
      });
      if (!response.ok) throw new Error('Failed to update post');

      await fetchPosts(); // Refresh posts to reflect the changes
      closeEditPostModal(); // Close the modal
    } catch (error) {
      console.error(error);
      setAlertMessage('Error updating post.'); // Set alert message
    }
  };

  const handleReaction = async (postId, reactionType) => {
    try {
      const response = await fetch(`https://socialserver-377n.onrender.com/api/posts/${postId}/reaction`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, reactionType }),
      });

      if (!response.ok) throw new Error('Failed to update reaction');

      const data = await response.json();
      setPosts((prevPosts) =>
        prevPosts.map((post) =>
          post._id === postId ? { ...post, reactions: data.reactions } : post
        )
      );
    } catch (error) {
      console.error('Error updating reaction:', error);
      setAlertMessage('Error updating reaction.');
    }
  };

  const handleDeletePost = async (postId) => {
    try {
      const response = await fetch(`https://socialserver-377n.onrender.com/api/posts/${postId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user: userId }),
      });
      if (!response.ok) throw new Error('Failed to delete post');

      setPosts((prevPosts) => prevPosts.filter((post) => post._id !== postId)); // Remove the deleted post from the state
    } catch (error) {
      console.error(error);
      setAlertMessage('Error deleting post.'); // Set alert message
    }
  };

  const closeNotificationModal = () => {
    setNotificationModal({ visible: false, message: '' });
  };

  const closeConfirmModal = () => {
    setConfirmModal({ visible: false, onConfirm: null, message: '' });
  };

  const showFullImage = (imageUrl) => {
    setFullImage(imageUrl); // Set the full image URL
  };

  const closeFullImage = () => {
    setFullImage(null); // Clear the full image URL
  };

  const renderSidebar = () => {
    console.log('Rendering sidebar. Current visibleOptions:', visibleOptions); // Debug log
    return (
      <div
        style={{ ...styles.sidebar, ...(showSidebar ? styles.sidebarOpen : {}) }}
        onClick={e => e.stopPropagation()} // Prevent sidebar clicks from closing it
      >
        <h3 style={styles.sidebarHeader}>Navigation</h3>
        <ul style={styles.sidebarList}>
          <li><button onClick={() => handleSectionChange('home')} style={styles.sidebarButton}>Home</button></li>
          <li><button onClick={() => handleSectionChange('profile')} style={styles.sidebarButton}>Profile</button></li>
          <li><button onClick={() => handleSectionChange('friends')} style={styles.sidebarButton}>Friends</button></li>
          <li><button onClick={() => handleSectionChange('messages')} style={styles.sidebarButton}>Messages</button></li>
          <li><button onClick={() => navigate('/GroupChat')} style={styles.sidebarButton}>Community</button></li>
          <li><button onClick={() => handleSectionChange('notifications')} style={styles.sidebarButton}>Notifications</button></li>
          <li><button onClick={() => navigate('/Set')} style={styles.sidebarButton}>Settings</button></li>
          <li><button onClick={() => navigate('/Dashboard')} style={styles.sidebarButton}>Mainpage</button></li>
          <li><button onClick={handleLogout} style={styles.sidebarButton}>Logout</button></li>
        </ul>
      </div>
    );
  };

  const renderSection = () => {
    console.log('Rendering section:', activeSection); // Debug log
    console.log('Current userId:', userId); // Debug log
    switch (activeSection) {
      case 'home':
        return (
          <section>
            <h2 style={styles.sectionHeader}>Home Feed</h2>
            <div style={styles.postForm}>
              <h3>Create Post</h3>
              <form onSubmit={handlePostSubmit} style={styles.postForm}>
  <textarea
    placeholder="What's on your mind?"
    style={styles.textarea}
    value={postText}
    onChange={(e) => setPostText(e.target.value)}
  ></textarea>
  <div style={styles.fileInputWrapper}>
    <label htmlFor="fileInput" style={styles.fileInputButton}>
      Image
    </label>
    <input
      type="file"
      id="fileInput"
      accept="image/*"
      style={{ display: 'none' }} // Hide the default file input
      onChange={(e) => setPostImage(e.target.files[0])}
    />
    <button type="submit" style={styles.submitButton}>
      Post
    </button>
  </div>
</form>
            </div>
            <div>
              {posts.map((post, index) => (
                <div key={`${post._id}-${index}`} style={styles.post}>
                  <div style={styles.postHeader}>
                    {post.user?.email && (
                      <div style={styles.postUserWrapper}>
                        <button
                          onClick={e => {
                            e.preventDefault();
                            e.stopPropagation();
                            localStorage.setItem('viewProfileId', post.user._id);
                            setActiveSection('profile');
                            setShowSidebar(false);
                          }}
                          style={styles.postUserLink}
                        >
                          {post.user.email}
                        </button>
                      </div>
                    )}
                    {post.user?._id === userId && ( // Ensure the user ID matches the post owner
                      <div style={styles.postOptionsWrapper}>
                        {console.log('Post User ID:', post.user?._id, 'Current User ID:', userId)} {/* Debugging log */}
                        <button
                          style={styles.postOptionsButton}
                          onClick={() => togglePostOptions(post._id)}
                        >
                          ⋮
                        </button>
                        {visibleOptions[post._id] && (
                          <div style={styles.postOptionsContainer}>
                            <button
                              style={styles.editButton}
                              onClick={() => handleEditPost(post._id, post.text)}
                            >
                              Edit
                            </button>
                            <button
                              style={styles.deleteButton}
                              onClick={() => handleDeletePost(post._id)} // Directly delete the post
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  {post.text && <p style={styles.postText}>{post.text}</p>}
                  {post.imageUrl && (
                    <img
                      src={post.imageUrl}
                      alt="Post"
                      style={styles.postImage}
                      onClick={() => showFullImage(post.imageUrl)} // Show full image on click
                    />
                  )}
                  <div style={styles.reactionButtons}>
                    <button onClick={() => handleReaction(post._id, 'love')} style={styles.loveButton}>Love ({post.reactions?.love?.length || 0})</button>
                    <button onClick={() => handleReaction(post._id, 'like')} style={styles.likeButton}>Like ({post.reactions?.like?.length || 0})</button>
                    <button onClick={() => handleReaction(post._id, 'dislike')} style={styles.dislikeButton}>Dislike ({post.reactions?.dislike?.length || 0})</button>
                    <button onClick={() => handleReaction(post._id, 'hate')} style={styles.hateButton}>Hate ({post.reactions?.hate?.length || 0})</button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        );
      case 'profile':
        return (
          <section>
            <h2 style={styles.sectionHeader}>Profile</h2>
            <div style={{ display: 'flex', alignItems: 'center', marginTop: '10px' }}>
              <img
                src={profile?.user?.profilePic || 'default-profile.png'}
                alt={profile?.user?.fullName || 'User'}
                style={{
                  width: '100px',
                  height: '100px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                }}
              />
              {profile?.user?._id === userId && (
                <button
                  id="changeProfilePicBtn"
                  style={{
                    marginLeft: '10px',
                    background: 'transparent',
                    border: 'none',
                    fontSize: '20px',
                    color: 'white',
                    cursor: 'pointer',
                  }}
                  onClick={() => document.getElementById('profilePicInput').click()}
                >
                  ✎
                </button>
              )}
              <input
                type="file"
                id="profilePicInput"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={async (e) => {
                  if (!e.target.files.length) return;
                  const formData = new FormData();
                  formData.append('profilePic', e.target.files[0]);
                  try {
                    const response = await fetch(
                      `https://socialserver-377n.onrender.com/api/profile/${userId}/profilePic`,
                      { method: 'PUT', body: formData }
                    );
                    if (response.ok) fetchProfile();
                  } catch (error) {
                    console.error('Error updating profile picture:', error);
                  }
                }}
              />
            </div>
            <div style={{ marginTop: '15px' }}>
              <p style={styles.profileText}>Name: {profile?.name || profile?.user?.fullName}</p>
              <p style={styles.profileText}>Email: {profile?.email || profile?.user?.email}</p>
              {/* Only show total posts and likes if viewing own profile */}
              {(profile?.user?._id === userId || profile?.userId === userId) && (
                <>
                  <p style={styles.profileText}>Total Posts: {profile?.postsCount}</p>
                  <p style={styles.profileText}>Total Likes: {profile?.totalLikes}</p>
                </>
              )}
              <div style={{ display: 'flex', flexWrap: 'wrap', marginTop: '10px' }}>
                {profile?.posts?.map((post) => (
                  <div
                    key={post._id}
                    style={{
                      width: '150px',
                      margin: '5px',
                      background: 'rgba(255,255,255,0.1)',
                      padding: '10px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                    }}
                    onClick={() => {
                      setActiveSection('home');
                      setTimeout(() => {
                        const postElement = document.getElementById(`post-${post._id}`);
                        if (postElement) {
                          postElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                          postElement.style.border = '2px solid yellow';
                          setTimeout(() => {
                            postElement.style.border = 'none';
                          }, 2000);
                        }
                      }, 500);
                    }}
                  >
                    {post.imageUrl ? (
                      <img
                        src={post.imageUrl}
                        alt="Post"
                        style={{ maxWidth: '100%', borderRadius: '5px' }}
                      />
                    ) : (
                      <p>{post.text.substring(0, 50)}...</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>
        );
      case 'friends':
        return (
          <section>
            <h2 style={styles.sectionHeader}>Friends</h2>
            <div>
              {friends.map(friend => (
                <div key={friend._id} style={styles.friendItem}>
                  <p style={styles.friendEmail}>{friend.email}</p>
                  <button
                    style={styles.chatIconButton}
                    onClick={() => startChat(friend._id)}
                  >
                    💬
                  </button>
                </div>
              ))}
            </div>
          </section>
        );
      case 'notifications':
        return (
          <section>
            <h2 style={styles.sectionHeader}>Notifications</h2>
            <div style={styles.notificationsContainer}>
              {notifications.map(notification => (
                <div key={notification._id} style={styles.notificationItem}>
                  <p style={styles.notificationMessage}>{notification.message}</p>
                </div>
              ))}
            </div>
          </section>
        );
      case 'messages':
        return (
          <section>
            <h2 style={styles.sectionHeader}>Messages</h2>
            <div>
              {conversations.length > 0 ? (
                conversations.map((partner) => (
                  <div
                    key={partner._id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '10px',
                      background: 'rgba(255, 255, 255, 0.1)',
                      borderRadius: '8px',
                      marginBottom: '10px',
                      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.2)',
                    }}
                  >
                    <p
                      style={{
                        fontSize: '16px',
                        fontWeight: 'bold',
                        color: '#ffffff',
                        background: 'rgba(0, 0, 0, 0.7)',
                        padding: '8px 12px',
                        borderRadius: '5px',
                        textShadow: '2px 2px 4px rgba(0, 0, 0, 0.8)',
                        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.3)',
                      }}
                    >
                      {partner.fullName}
                    </p>
                    <button
                      onClick={() => navigate(`/chat?partnerId=${partner._id}`)}
                      style={{
                        padding: '5px 8px',
                        background: 'rgba(0, 0, 0, 0.7)',
                        border: 'none',
                        borderRadius: '5px',
                        color: '#ffffff',
                        fontSize: '14px',
                        fontWeight: 'bold',
                        textShadow: '2px 2px 4px rgba(0, 0, 0, 0.8)',
                        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.3)',
                        cursor: 'pointer',
                        transition: 'background 0.3s ease, transform 0.2s',
                      }}
                    >
                      Open Chat
                    </button>
                  </div>
                ))
              ) : (
                <p>No conversations yet</p>
              )}
            </div>
          </section>
        );
      default:
        return null;
    }
  };

  return (
    <div
      style={styles.container}
      onClick={() => {
        if (showSidebar) setShowSidebar(false);
        if (Object.keys(visibleOptions).length > 0) setVisibleOptions({});
      }}
    >
      {/* Full Image Modal */}
      {fullImage && (
        <div style={styles.fullImageModal} onClick={closeFullImage}>
          <img src={fullImage} alt="Full View" style={styles.fullImage} />
        </div>
      )}
      <header style={styles.header}>
        <h1 style={styles.headerTitle}>TradeSpot Social Hub</h1>
        <button
          onClick={e => {
            e.stopPropagation();
            toggleSidebar();
          }}
          style={styles.sidebarToggle}
        >
          MENU
        </button>
      </header>
      <div style={styles.main}>
        {renderSidebar()}
        <div
          style={styles.content}
          onClick={e => {
            let closed = false;
            if (showSidebar) {
              setShowSidebar(false);
              closed = true;
            }
            if (Object.keys(visibleOptions).length > 0) {
              setVisibleOptions({});
              closed = true;
            }
            if (closed) e.stopPropagation();
          }}
        >
          {renderSection()}
        </div>
      </div>
      {deleteModalVisible && (
        <div style={styles.modal}>
          <div style={styles.modalContent}>
            <h3>Account Deletion Request</h3>
            <textarea placeholder="Reason for deleting your account" style={styles.textarea}></textarea>
            <button style={styles.submitButton} onClick={() => handleDeleteAccount()}>Submit</button>
            <button style={styles.cancelButton} onClick={() => setDeleteModalVisible(false)}>Cancel</button>
          </div>
        </div>
      )}
      {updateEmailModalVisible && (
        <div style={styles.modal}>
          <div style={styles.modalContent}>
            {updateEmailStep === 1 && (
              <>
                <h3>Send Verification Code</h3>
                <p>Click the button below to send a verification code to your email.</p>
                <button style={styles.submitButton} onClick={sendVerificationCode}>Send Code</button>
                <button style={styles.cancelButton} onClick={() => setUpdateEmailModalVisible(false)}>Cancel</button>
              </>
            )}
            {updateEmailStep === 2 && (
              <>
                <h3>Verify Code</h3>
                <p>Enter the verification code sent to your email:</p>
                <input
                  type="text"
                  placeholder="Enter code"
                  style={styles.textarea}
                  onChange={(e) => setVerificationCode(e.target.value)}
                />
                <button style={styles.submitButton} onClick={() => verifyCode(verificationCode)}>Verify Code</button>
                <button style={styles.cancelButton} onClick={() => setUpdateEmailModalVisible(false)}>Cancel</button>
              </>
            )}
            {updateEmailStep === 3 && (
              <>
                <h3>Enter New Email</h3>
                <input
                  type="email"
                  placeholder="Enter new email"
                  style={styles.textarea}
                  onChange={(e) => setPostText(e.target.value)}
                />
                <button style={styles.submitButton} onClick={() => submitNewEmail(postText)}>Submit New Email</button>
                <button style={styles.cancelButton} onClick={() => setUpdateEmailModalVisible(false)}>Cancel</button>
              </>
            )}
          </div>
        </div>
      )}
      {notificationModal.visible && (
        <div style={styles.modal}>
          <div style={styles.modalContent}>
            <h3>Notification</h3>
            <p>{notificationModal.message}</p>
            <button style={styles.cancelButton} onClick={closeNotificationModal}>Close</button>
          </div>
        </div>
      )}
      {confirmModal.visible && (
        <div style={styles.modal}>
          <div style={styles.modalContent}>
            <p>{confirmModal.message}</p>
            <button
              style={styles.submitButton}
              onClick={confirmModal.onConfirm}
            >
              Yes
            </button>
            <button
              style={styles.cancelButton}
              onClick={closeConfirmModal}
            >
              No
            </button>
          </div>
        </div>
      )}
      {editPostModal.visible && (
        <div style={styles.modal}>
          <div style={styles.modalContent}>
            <h3>Edit Post</h3>
            <textarea
              value={editPostModal.currentText}
              onChange={(e) => setEditPostModal({ ...editPostModal, currentText: e.target.value })}
              style={styles.textarea}
            ></textarea>
            <div style={styles.modalButtonWrapper}>
              <button style={styles.modalButton} onClick={handleEditPostSubmit}>Save</button>
              <button style={styles.cancelButton} onClick={closeEditPostModal}>Cancel</button>
            </div>
          </div>
        </div>
      )}
      {alertMessage && (
        <StyledAlert
          message={alertMessage}
          onClose={() => {
            setAlertMessage(''); // Clear alert
            setAlertCallback(null);
          }}
          onConfirm={alertCallback} // Execute callback if confirmed
        />
      )}
    </div>
  );
};

const styles = {
  container: { height: '100vh', display: 'flex', flexDirection: 'column', background: 'linear-gradient(to right, #1f4037, #99f2c8)', color: 'white' },
  header: { background: 'rgba(255, 255, 255, 0.05)', padding: '8px 10px', textAlign: 'center', position: 'relative', zIndex: 1100 },
  headerTitle: { fontSize: '24px', fontWeight: '900', letterSpacing: '2px', textTransform: 'uppercase', textShadow: '4px 4px 10px rgba(0, 0, 0, 0.8)' },
  sidebarToggle: { display: 'inline-block', background: '#007f5f', color: '#fff', padding: '9px 13px', border: 'none', fontSize: '10px', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0, 0, 0, 0.3)', transition: 'all 0.3s ease', cursor: 'pointer', marginTop: '10px' },
  sidebarToggleHover: { background: '#005f45', transform: 'translateY(-2px)' },
  main: { display: 'flex', flex:1, overflow: 'hidden', position: 'relative' },
  sidebar: {
    position: 'absolute',
    top: '5px',
    left: '0',
    height: 'calc(100vh - 80px)',
    width: '220px',
    background: '#1f4037',
    borderRadius: '10px',
    padding: '20px',
    color: 'white',
    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.5)',
    transition: 'transform 0.3s ease-in-out, opacity 0.3s ease-in-out',
    transform: 'translate(-300px, 100px)', // Start off-screen to the left and slightly down
    opacity: 0,
    zIndex: 1000,
    overflowY: 'auto',
    pointerEvents: 'none', // Disable interaction when hidden
  },
  sidebarOpen: {
    transform: 'translate(0, 0)', // Slide into view from the bottom-left corner
    opacity: 1,
    pointerEvents: 'auto', // Enable interaction when visible
  },
  sidebarHeader: {
    fontSize: '26px',
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: '2px',
    color: '#fff',
    marginBottom: '20px',
    textAlign: 'center',
    borderBottom: '2px solid #0c863d', // Accent underline
    paddingBottom: '10px',
  },
  sidebarList: {
    listStyle: 'none',
    padding: 0,
  },
  sidebarButton: {
    textDecoration: 'none',
    fontWeight: '600',
    display: 'block',
    width: '100%', // Make the button fit the sidebar width
    padding: '12px 20px',
    borderRadius: '8px',
    color: '#fff',
    background: '#444', // Darker background for buttons
    marginBottom: '15px',
    transition: 'background 0.3s ease, transform 0.2s',
    border: '1px solid #333', // Add subtle border
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)', // Add shadow for depth
    cursor: 'pointer',
    textAlign: 'center', // Center-align text
  },
  sidebarButtonHover: {
    background: '#00b894', // Highlight color on hover
    transform: 'translateX(5px)', // Slight movement on hover
  },
  content: { flex: 1, background: 'rgba(255, 255, 255, 0.05)', borderRadius: '20px', margin: '20px', padding: '20px', boxShadow: '0 8px 30px rgba(0,0,0,0.2)', overflowY: 'auto' },
  sectionHeader: { fontFamily: 'Georgia, serif', fontSize: '28px', color: '#ffffff', background: 'rgba(0, 0, 0, 0.5)', padding: '10px 15px', marginBottom: '20px', borderRadius: '5px', textShadow: '0 2px 3px rgba(0,0,0,0.3)' },
  postForm: { background: 'rgba(255, 255, 255, 0.1)', padding: '15px', borderRadius: '10px', marginBottom: '20px', boxShadow: '0 8px 30px rgba(0,0,0,0.2)' },
  settingsButton: { fontWeight: 'bold', fontSize: '15px', padding: '10px', background: '#007f5f', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer' },
  commentFormCompact: {
      display: 'flex',
      alignItems: 'center',
      marginBottom: '10px'
    },
  color: '#fff',
  border: 'none',
  borderRadius: '5px',
  cursor: 'pointer',
  marginRight: '10px',
  width: 'auto', // Ensure consistent width
  postActions: { marginTop: '10px', display: 'flex', gap: '10px' },
  likeCount: {
    fontSize: '14px',
    color: '#fff',
    fontWeight: 'bold', // Make the number solid
  },
  commentActions: {
    marginTop: '5px',
    display: 'flex',
    gap: '5px',
  },
  commentEditButton: {
    background: '#2c3e50', // Dark blue-gray color
    border: 'none',
    padding: '4px 8px',
    borderRadius: '4px',
    color: '#fff',
    fontSize: '12px',
    cursor: 'pointer',
    marginLeft: '10px',
    transition: 'background 0.2s ease',
  },
  commentDeleteButton: {
    background: '#8b0000', // Dark red color
    border: 'none',
    padding: '4px 8px',
    borderRadius: '4px',
    color: '#fff',
    fontSize: '12px',
    cursor: 'pointer',
    marginLeft: '5px',
    transition: 'background 0.2s ease',
  },
  commentOptionsWrapper: {
    position: 'relative',
    display: 'inline-block',
    marginLeft: '10px',
  },
  commentOptionsButton: {
    background: '#444',
    border: 'none',
    padding: '3px 6px',
    borderRadius: '4px',
    color: '#fff',
    fontSize: '12px', // Adjusted font size for better visibility
    cursor: 'pointer',
    transition: 'background 0.2s ease',
  },
  commentOptionsContainer: {
    position: 'absolute',
    top: '20px', // Adjusted position for better visibility
    right: 0,
    background: '#fff',
    borderRadius: '5px',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
    zIndex: 10,
    display: 'flex',
    flexDirection: 'column',
    gap: '5px',
    padding: '5px',
    color: '#000', // Ensure text inside the menu is visible
  },
  modal: {
    display: 'flex',
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    background: 'rgba(0, 0, 0, 0.8)', // Dark overlay
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2000,
  },
  modalContent: {
    background: '#1f4037', // Dark green background
    color: '#ffffff', // White text
    padding: '20px',
    borderRadius: '10px',
    width: '100%',
    maxWidth: '400px',
    boxShadow: '0 8px 15px rgba(0, 0, 0, 0.5)',
    textAlign: 'center',
  },
  modalButtonWrapper: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '10px',
    marginTop: '15px',
  },
  modalButton: {
    background: '#007f5f',
    color: '#ffffff',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '5px',
    fontSize: '14px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'background 0.3s ease',
  },
  cancelButton: {
    background: '#da0c0c',
    color: '#ffffff',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '5px',
    fontSize: '14px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'background 0.3s ease',
  },
    likeButton: {
      background: '#007f5f', // Green background
      color: '#fff', // White text
      border: 'none', // No border
      padding: '6px 8px', // Padding for the button
      borderRadius: '5px', // Rounded corners
      fontSize: '14px', // Font size
      fontWeight: 'bold', // Bold text
      cursor: 'pointer', // Pointer cursor
      transition: 'background 0.3s ease', // Smooth hover effect
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.2)', // Add shadow for depth
    },
    likeButtonHover: {
      background: '#005f45', // Darker green on hover
    },
  
    commentButton: {
      background: '#007f5f', // Blue background
      color: '#fff', // White text
      border: 'none', // No border
      padding: '6px 8px', // Padding for the button
      borderRadius: '5px', // Rounded corners
      fontSize: '14px', // Font size
      fontWeight: 'bold', // Bold text
      cursor: 'pointer', // Pointer cursor
      transition: 'background 0.3s ease', // Smooth hover effect
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.2)', // Add shadow for depth
    },
    commentButtonHover: {
      background: '#003f7f', // Darker blue on hover
    },
    submitButton: {
      background: '#007f5f', // Green background
      color: '#ffffff', // White text
      border: 'none', // Remove border
      width: '40px', // Set width for the circle
      height: '40px', // Set height for the circle
      borderRadius: '50%', // Make it circular
      fontSize: '14px', // Adjust font size
      fontWeight: 'bold', // Make the text bold
      cursor: 'pointer', // Pointer cursor
      display: 'flex', // Flex for centering the text
      alignItems: 'center', // Center text vertically
      justifyContent: 'center', // Center text horizontally
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.2)', // Add shadow for depth
      transition: 'background 0.3s ease', // Smooth hover effect
    },
    submitButtonHover: {
      background: '#1c86ee', // Slightly darker blue on hover
    },
  postImage: {
    maxWidth: '100%', // Ensure the image doesn't exceed the container width
    borderRadius: '8px', // Optional: Add rounded corners
    objectFit: 'cover', // Ensure the image fits nicely
    marginTop: '10px', // Add spacing from the text
    cursor: 'pointer', // Add pointer cursor for interactivity
    transition: 'transform 0.2s ease', // Smooth hover effect
  },
  postImageHover: {
    transform: 'scale(1.05)', // Slight zoom on hover
  },
  fullImageModal: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.8)', // Dark overlay
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  fullImage: {
    maxWidth: '90%',
    maxHeight: '90%',
    borderRadius: '10px',
    objectFit: 'contain',
  },
  postUser: {
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#4df4d3',
    background: 'rgba(0, 0, 0, 0.2)',
    padding: '5px 10px',
    borderRadius: '8px',
    display: 'inline-block',
    marginBottom: '10px',
    boxShadow: '0 2px 5px rgba(0, 0, 0, 0.3)',
    textAlign: 'left', // Align text to the left
  },
  postUserLink: {
    textDecoration: 'none',
    color: '#4df4d3',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: 'bold',
    padding: 0,
  },
  slimText: {
    fontSize: '12px',
    fontWeight: '300', // Slim writing pattern
    color: '#ffffff', // Clean visible white
  },
  friendItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px',
    background: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '8px',
    marginBottom: '10px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.2)',
  },
  friendEmail: {
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#ffffff',
    background: 'rgba(0, 0, 0, 0.7)',
    padding: '8px 12px',
    borderRadius: '5px',
    textShadow: '2px 2px 4px rgba(0, 0, 0, 0.8)',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.3)',
  },
  chatIconButton: {
    width: '35px',
    height: '35px',
    background: 'rgba(0, 0, 0, 0.7)', // Match the email background
    border: 'none',
    borderRadius: '50%', // Make it round
    color: '#ffffff',
    fontSize: '18px', // Icon size
    fontWeight: 'bold',
    textShadow: '2px 2px 4px rgba(0, 0, 0, 0.8)',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.3)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background 0.3s ease, transform 0.2s',
  },
  chatIconButtonHover: {
    background: '#0056b3', // Slightly lighter blue on hover
    transform: 'translateY(-2px)', // Slight lift on hover
  },
  profileText: {
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#ffffff',
    background: 'rgba(0, 0, 0, 0.5)',
    padding: '8px 12px',
    borderRadius: '5px',
    textShadow: '2px 2px 4px rgba(0, 0, 0, 0.8)',
    marginBottom: '10px',
  },
 postFooter: {
    display: 'flex',
    gap: '15px', // Add gap to control spacing between buttons
    alignItems: 'center',
    marginTop: '10px',
  },
  postOptionsWrapper: {
    display: 'flex',
    justifyContent: 'flex-end', // Align to the extreme right
    alignItems: 'center',
    position: 'absolute', // Position relative to the post header
    right: '10px', // Adjust spacing from the right edge
    top: '0',
  },
  postOptionsButton: {
    background: '#444',
    border: 'none',
    padding: '2px 4px', // Adjust padding for a square shape
    borderRadius: '5px', // Change from '50%' to '5px' for a square with rounded corners
    color: '#fff',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'background 0.3s ease',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.2)',
},
  postOptionsButtonHover: {
    background: '#555', // Slightly lighter on hover
  },
  postOptionsContainer: {
    position: 'absolute',
    top: '30px',
    right: '0',
    background: '#fff',
    borderRadius: '5px',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
    zIndex: 10,
    display: 'flex',
    flexDirection: 'column',
    gap: '5px',
    padding: '5px',
    color: '#000',
  },
  post: {
    background: 'rgba(255, 255, 255, 0.1)',
    padding: '15px',
    borderRadius: '10px',
    marginBottom: '20px', // Add spacing between posts
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)', // Optional: Add shadow for depth
  },
  editButton: {
    background: 'linear-gradient(to right, #1e2d24, #0f1c18)', // Smooth gradient
    border: 'none',
    padding: '5px 10px',
    borderRadius: '5px',
    color: '#fff', // Bold white text
    fontSize: '14px',
    fontWeight: 'bold', // Bold font
    cursor: 'pointer',
    transition: 'background 0.2s ease',
    fontFamily: 'Arial, Helvetica, sans-serif', // Sans-serif font
  },
  editButtonHover: {
    background: '#1a241e', // Slightly lighter green on hover
  },
  deleteButton: {
    background: 'linear-gradient(to right, #1e2d24, #0f1c18)', // Smooth gradient
    border: 'none',
    padding: '5px 10px',
    borderRadius: '5px',
    color: '#fff', // Bold white text
    fontSize: '14px',
    fontWeight: 'bold', // Bold font
    cursor: 'pointer',
    transition: 'background 0.2s ease',
    fontFamily: 'Arial, Helvetica, sans-serif', // Sans-serif font
  },
  deleteButtonHover: {
    background: '#1a241e', // Slightly lighter green on hover
  },
postText: {
  fontSize: '18px', // Increase font size for better visibility
  lineHeight: '1.8', // Add more spacing between lines
  color: '#ffffff', // White text for contrast
  background: 'rgba(0, 0, 0, 0.4)', // Slightly darker background for emphasis
  padding: '12px', // Add more padding around the text
  borderRadius: '10px', // Rounded corners for a modern look
  textShadow: '2px 2px 5px rgba(0, 0, 0, 0.9)', // Stronger shadow for a solid look
  fontWeight: '900', // Make the text bold and solid
  marginTop: '15px', // Add more spacing above the text
},

commentText: {
  margin: '5px 0', // Add spacing between comments
  color: '#ffffff', // White text for visibility
  fontSize: '14px', // Adjust font size for readability
  fontWeight: 'bold', // Make the text bold
  background: 'rgba(0, 0, 0, 0.3)', // Subtle background for individual comments
  padding: '8px 12px', // Add padding for better spacing
  borderRadius: '8px', // Rounded corners for a clean look
  textShadow: '1px 1px 3px rgba(0, 0, 0, 0.8)', // Add shadow for depth
},
reactionButtons: {
  display: 'flex',
  gap: '5px', // Reduced gap between buttons
  marginTop: '10px',
},
loveButton: {
  background: '#ff69b4',
  color: '#fff',
  border: 'none',
  padding: '4px 6px', // Reduced padding
  borderRadius: '3px', // Reduced border radius
  fontSize: '12px', // Reduced font size
  fontWeight: 'bold',
  cursor: 'pointer',
  transition: 'background 0.3s ease',
},
dislikeButton: {
  background: '#ff4500',
  color: '#fff',
  border: 'none',
  padding: '4px 6px', // Reduced padding
  borderRadius: '3px', // Reduced border radius
  fontSize: '12px', // Reduced font size
  fontWeight: 'bold',
  cursor: 'pointer',
  transition: 'background 0.3s ease',
},
hateButton: {
  background: '#8b0000',
  color: '#fff',
  border: 'none',
  padding: '4px 6px', // Reduced padding
  borderRadius: '3px', // Reduced border radius
  fontSize: '12px', // Reduced font size
  fontWeight: 'bold',
  cursor: 'pointer',
  transition: 'background 0.3s ease',
},
commentSection: {
  marginTop: '10px',
  padding: '10px', // Reduce padding for a more compact look
  background: 'rgba(0, 0, 0, 0.5)', // Darker background for emphasis
  borderRadius: '10px', // Rounded corners for a modern look
  boxShadow: '0 4px 15px rgba(0, 0, 0, 0.5)', // Add shadow for depth
  color: '#ffffff', // White text for contrast
  maxHeight: '300px', // Limit the height of the comment section
  overflowY: 'auto', // Add scrolling for overflow content
},

commentForm: {
  display: 'flex',
  alignItems: 'center',
  gap: '10px', // Add spacing between the input field and the button
  marginBottom: '10px', // Add spacing below the form
},

commentInput: {
  width: '100%', // Full width for the input
  padding: '10px', // Add padding for better spacing
  border: '1px solid rgba(255, 255, 255, 0.3)', // Subtle border for visibility
  borderRadius: '8px', // Rounded corners for a modern look
  background: 'rgba(0, 0, 0, 0.2)', // Slightly transparent background
  color: '#ffffff', // White text for contrast
  fontSize: '14px', // Adjust font size for readability
  outline: 'none', // Remove default outline
},
textarea: {
  width: '100%', // Full width
  padding: '20px', // Add padding for better spacing
  border: '1px solid rgba(255, 255, 255, 0.3)', // Subtle border for visibility
  borderRadius: '4px', // Rounded corners for a modern look
  background: 'rgba(0, 0, 0, 0.57)', // Dark background
  color: '#ffffff', // White text for contrast
  fontSize: '14px', // Adjust font size for readability
  outline: 'none', // Remove default outline
  marginBottom: '1px', // Add spacing below the input
},
fileInputWrapper: {
  display: 'flex', // Align items in a single line
  alignItems: 'center', // Center items vertically
  gap: '10px', // Add spacing between buttons
  marginTop: '10px', // Add spacing above the buttons
},
fileInputButton: {
  background: '#007f5f', // Green background
  color: '#ffffff', // White text
  border: 'none', // Remove border
  width: '40px', // Set width for the circle
  height: '40px', // Set height for the circle
  borderRadius: '50%', // Make it circular
  fontSize: '14px', // Adjust font size
  fontWeight: 'bold', // Make the text bold
  cursor: 'pointer', // Pointer cursor
  display: 'flex', // Flex for centering the text
  alignItems: 'center', // Center text vertically
  justifyContent: 'center', // Center text horizontally
  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.2)', // Add shadow for depth
  transition: 'background 0.3s ease', // Smooth hover effect
},
commentSubmitButton: {
  background: '#007f5f', // Green background for the button
  color: '#ffffff', // White text for contrast
  border: 'none', // Remove border
  padding: '8px 12px', // Add padding for better spacing
  borderRadius: '8px', // Rounded corners for a modern look
  fontSize: '14px', // Adjust font size for readability
  fontWeight: 'bold', // Make the text bold
  cursor: 'pointer', // Pointer cursor for interactivity
  transition: 'background 0.3s ease', // Smooth hover effect
  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.2)', // Add shadow for depth
},
  postHeader: {
    display: 'flex',
    justifyContent: 'space-between', // Ensure email and options are spaced apart
    alignItems: 'center',
    position: 'relative', // For positioning the options button
  },
  notificationsContainer: {
    maxHeight: '350px',
    overflowY: 'auto',
    padding: '10px',
    background: 'rgba(0,0,0,0.15)',
    borderRadius: '10px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
    marginBottom: '10px',
  },
  notificationItem: {
    background: 'linear-gradient(90deg, #1f4037 60%, #99f2c8 100%)',
    color: '#fff',
    borderRadius: '8px',
    padding: '15px 18px',
    marginBottom: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
    fontWeight: 'bold',
    fontSize: '16px',
    transition: 'background 0.2s',
    borderLeft: '5px solid #00b894',
  },
  notificationMessage: {
    margin: 0,
    color: '#fff',
    fontWeight: 600,
    letterSpacing: '0.5px',
    textShadow: '1px 1px 3px rgba(0,0,0,0.18)',
  },
};

styles.commentUserEmail = {
  fontSize: '12px', // Small font size for subtle appearance
  fontWeight: 'bold', // Bold text for emphasis
  color: '#4df4d3', // Light teal color for visibility
  background: 'rgba(0, 0, 0, 0.2)', // Subtle background for contrast
  padding: '4px 8px', // Add padding for spacing
  borderRadius: '5px', // Rounded corners for a clean look
  display: 'inline-block', // Inline-block for proper spacing
  marginBottom: '5px', // Add spacing below the email
};
export default Sdb;
