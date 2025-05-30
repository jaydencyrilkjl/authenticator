import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import StyledAlert from './components/StyledAlert'; // Import StyledAlert

const Set = () => {
  const navigate = useNavigate();
  const [showNameModal, setShowNameModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false); // State for password modal
  const [showDeleteModal, setShowDeleteModal] = useState(false); // State for delete account modal
  const [newName, setNewName] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [emailVerificationCode, setEmailVerificationCode] = useState('');
  const [passwordVerificationCode, setPasswordVerificationCode] = useState(''); // State for password verification code
  const [deleteVerificationCode, setDeleteVerificationCode] = useState(''); // State for verification code
  const [newPassword, setNewPassword] = useState(''); // State for new password
  const [confirmPassword, setConfirmPassword] = useState(''); // State for confirm password
  const [passwordVisible, setPasswordVisible] = useState(false); // Toggle visibility for new password
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false); // Toggle visibility for confirm password
  const [newEmail, setNewEmail] = useState(''); // State for new email
  const [emailStep, setEmailStep] = useState(1); // Step 1: Send code, Step 2: Verify code, Step 3: Enter new email
  const [passwordStep, setPasswordStep] = useState(1); // Step 1: Send code, Step 2: Verify code, Step 3: Enter new password
  const [deleteStep, setDeleteStep] = useState(1); // Step 1: Send code, Step 2: Verify code, Step 3: Enter reason
  const [step, setStep] = useState(1); // Step 1: Enter name, Step 2: Verify code
  const [deletionReason, setDeletionReason] = useState(''); // State for deletion reason
  const [alertMessage, setAlertMessage] = useState(''); // State for alert message
  const [showAlert, setShowAlert] = useState(false); // State to show/hide alert

  const showAlertMessage = (message) => {
    setAlertMessage(message);
    setShowAlert(true);
  };

  const closeAlert = () => {
    setShowAlert(false);
    setAlertMessage('');
  };

  const styles = {
    container: {
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: 'linear-gradient(to right, #1f4037, #99f2c8)',
      color: 'white',
      padding: '20px',
    },
    header: {
      fontSize: '28px',
      fontWeight: 'bold',
      textAlign: 'center',
      marginBottom: '20px',
      textShadow: '2px 2px 4px rgba(0, 0, 0, 0.8)',
    },
    button: {
      width: '100%',
      background: 'linear-gradient(to right, #1e2d24, #0f1c18)',
      color: '#fff',
      fontWeight: 'bold',
      fontFamily: 'Arial, Helvetica, sans-serif',
      padding: '10px',
      border: 'none',
      borderRadius: '5px',
      marginTop: '5px',
      marginBottom: '5px',
      cursor: 'pointer',
      transition: 'background 0.3s ease',
    },
    modal: {
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      background: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    },
    modalContent: {
      background: '#1f4037',
      color: '#fff',
      padding: '20px',
      borderRadius: '10px',
      width: '300px',
      textAlign: 'center',
    },
    input: {
      width: '100%',
      padding: '10px',
      margin: '10px 0',
      borderRadius: '5px',
      border: '1px solid #ccc',
    },
    closeButton: {
      marginTop: '10px',
      background: '#da0c0c',
      color: '#fff',
      border: 'none',
      padding: '10px',
      borderRadius: '5px',
      cursor: 'pointer',
    },
  };

  const sendCode = async () => {
    if (!newName.trim()) {
      showAlertMessage('Please enter a new name');
      return;
    }
    try {
      const response = await fetch('https://socialserver-377n.onrender.com/api/profile/sendNameUpdateCode', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user: localStorage.getItem('userId'), newName }),
      });
      const data = await response.json();
      if (response.ok) {
        showAlertMessage(data.message);
        setStep(2); // Move to verification step
      } else {
        showAlertMessage('Error: ' + data.message);
      }
    } catch (error) {
      console.error('Error sending code:', error);
      showAlertMessage('Error sending code');
    }
  };

  const verifyCodeAndUpdateName = async () => {
    if (!verificationCode.trim()) {
      showAlertMessage('Please enter the verification code');
      return;
    }
    try {
      const response = await fetch('https://socialserver-377n.onrender.com/api/profile/verifyNameUpdate', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user: localStorage.getItem('userId'),
          newName,
          code: verificationCode,
        }),
      });
      const data = await response.json();
      if (response.ok) {
        showAlertMessage(data.message);
        setShowNameModal(false); // Close modal on success
        setStep(1); // Reset to initial step
        setNewName('');
        setVerificationCode('');
        navigate('/Sdb'); // Redirect to dashboard
      } else {
        showAlertMessage('Error: ' + data.message);
      }
    } catch (error) {
      console.error('Error verifying code:', error);
      showAlertMessage('Error updating name');
    }
  };

  const sendEmailCode = async () => {
    try {
      const response = await fetch('https://socialserver-377n.onrender.com/api/profile/sendEmailUpdateCode', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user: localStorage.getItem('userId') }),
      });
      const data = await response.json();
      if (response.ok) {
        showAlertMessage(data.message);
        setEmailStep(2); // Move to verification step
      } else {
        showAlertMessage('Error: ' + data.message);
      }
    } catch (error) {
      console.error('Error sending email code:', error);
      showAlertMessage('Error sending code');
    }
  };

  const verifyEmailCode = async () => {
    if (!emailVerificationCode.trim()) {
      showAlertMessage('Please enter the verification code');
      return;
    }
    try {
      const response = await fetch('https://socialserver-377n.onrender.com/api/profile/verifyEmailUpdateCode', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user: localStorage.getItem('userId'),
          code: emailVerificationCode,
        }),
      });
      const data = await response.json();
      if (response.ok) {
        showAlertMessage(data.message);
        setEmailStep(3); // Move to enter new email step
      } else {
        showAlertMessage('Error: ' + data.message);
      }
    } catch (error) {
      console.error('Error verifying email code:', error);
      showAlertMessage('Error verifying code');
    }
  };

  const submitNewEmail = async () => {
    if (!newEmail.trim()) {
      showAlertMessage('Please enter a new email');
      return;
    }
    try {
      const response = await fetch('https://socialserver-377n.onrender.com/api/profile/submitEmailUpdate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user: localStorage.getItem('userId'),
          newEmail,
        }),
      });
      const data = await response.json();
      if (response.ok) {
        showAlertMessage(data.message);
        setShowEmailModal(false); // Close modal on success
        setEmailStep(1); // Reset to initial step
        setEmailVerificationCode('');
        setNewEmail('');
      } else {
        showAlertMessage('Error: ' + data.message);
      }
    } catch (error) {
      console.error('Error submitting new email:', error);
      showAlertMessage('Error updating email');
    }
  };

  const sendPasswordCode = async () => {
    try {
      const response = await fetch('https://socialserver-377n.onrender.com/api/profile/sendPasswordUpdateCode', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user: localStorage.getItem('userId') }),
      });
      const data = await response.json();
      if (response.ok) {
        showAlertMessage(data.message);
        setPasswordStep(2); // Move to verification step
      } else {
        showAlertMessage('Error: ' + data.message);
      }
    } catch (error) {
      console.error('Error sending password code:', error);
      showAlertMessage('Error sending code');
    }
  };

  const verifyPasswordCode = async () => {
    if (!passwordVerificationCode.trim()) {
      showAlertMessage('Please enter the verification code');
      return;
    }
    try {
      const response = await fetch('https://socialserver-377n.onrender.com/api/profile/verifyPasswordUpdate', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user: localStorage.getItem('userId'),
          code: passwordVerificationCode,
        }),
      });
      const data = await response.json();
      if (response.ok) {
        showAlertMessage(data.message);
        setPasswordStep(3); // Move to enter new password step
      } else {
        showAlertMessage('Error: ' + data.message);
      }
    } catch (error) {
      console.error('Error verifying password code:', error);
      showAlertMessage('Error verifying code');
    }
  };

  const updatePassword = async () => {
    if (!newPassword.trim() || !confirmPassword.trim()) {
      showAlertMessage('Please fill in both password fields');
      return;
    }
    if (newPassword !== confirmPassword) {
      showAlertMessage('Passwords do not match');
      return;
    }
    try {
      const response = await fetch('https://socialserver-377n.onrender.com/api/profile/updatePassword', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user: localStorage.getItem('userId'),
          newPassword, // Send the new password to the backend
        }),
      });

      // Check if the response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Invalid response from server');
      }

      const data = await response.json();
      if (response.ok) {
        showAlertMessage(data.message);
        setShowPasswordModal(false); // Close modal on success
        setPasswordStep(1); // Reset to initial step
        setPasswordVerificationCode('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        showAlertMessage('Error: ' + data.message);
      }
    } catch (error) {
      console.error('Error updating password:', error);
      showAlertMessage('Error updating password: ' + error.message);
    }
  };

  const sendDeleteCode = async () => {
    try {
      const response = await fetch('https://socialserver-377n.onrender.com/api/profile/sendDeleteAccountCode', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user: localStorage.getItem('userId') }),
      });
      const data = await response.json();
      if (response.ok) {
        showAlertMessage(data.message);
        setDeleteStep(2); // Move to verification step
      } else {
        showAlertMessage('Error: ' + data.message);
      }
    } catch (error) {
      console.error('Error sending delete account code:', error);
      showAlertMessage('Error sending code');
    }
  };

  const verifyDeleteCode = async () => {
    if (!deleteVerificationCode.trim()) {
      showAlertMessage('Please enter the verification code');
      return;
    }
    try {
      const response = await fetch('https://socialserver-377n.onrender.com/api/profile/verifyDeleteAccountCode', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user: localStorage.getItem('userId'),
          code: deleteVerificationCode,
        }),
      });
      const data = await response.json();
      if (response.ok) {
        showAlertMessage(data.message);
        setDeleteStep(3); // Move to enter reason step
      } else {
        showAlertMessage('Error: ' + data.message);
      }
    } catch (error) {
      console.error('Error verifying delete account code:', error);
      showAlertMessage('Error verifying code');
    }
  };

  const submitDeletionRequest = async () => {
    if (!deletionReason.trim()) {
      showAlertMessage('Please enter a reason for account deletion');
      return;
    }
    try {
      const response = await fetch('https://socialserver-377n.onrender.com/api/profile/deleteAccountRequest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user: localStorage.getItem('userId'),
          reason: deletionReason,
        }),
      });
      const data = await response.json();
      if (response.ok) {
        showAlertMessage(data.message);
        setShowDeleteModal(false); // Close modal on success
        setDeleteStep(1); // Reset to initial step
        setDeleteVerificationCode('');
        setDeletionReason('');
      } else {
        showAlertMessage('Error: ' + data.message);
      }
    } catch (error) {
      console.error('Error submitting deletion request:', error);
      showAlertMessage('Error submitting request');
    }
  };

  return (
    <div style={styles.container}>
      {showAlert && <StyledAlert message={alertMessage} onClose={closeAlert} />}
      <h1 style={styles.header}>Settings</h1>
      <button style={styles.button} onClick={() => setShowNameModal(true)}>
        Update Name
      </button>
      <button style={styles.button} onClick={() => setShowEmailModal(true)}>
        Update Email
      </button>
      <button style={styles.button} onClick={() => setShowPasswordModal(true)}>
        Update Password
      </button>
      <button style={styles.button} onClick={() => setShowDeleteModal(true)}>
        Delete Account
      </button>
      <button style={styles.button} onClick={() => navigate('/Sdb')}>
        Back to Home
      </button>

      {/* Name Modal */}
      {showNameModal && (
        <div style={styles.modal}>
          <div style={styles.modalContent}>
            {step === 1 && (
              <>
                <h2>Update Your Name</h2>
                <input
                  type="text"
                  placeholder="Enter new name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  style={styles.input}
                />
                <button style={styles.button} onClick={sendCode}>
                  Send Code
                </button>
              </>
            )}
            {step === 2 && (
              <>
                <h2>Verify Code</h2>
                <input
                  type="text"
                  placeholder="Enter verification code"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  style={styles.input}
                />
                <button style={styles.button} onClick={verifyCodeAndUpdateName}>
                  Update Name
                </button>
              </>
            )}
            <button style={styles.closeButton} onClick={() => setShowNameModal(false)}>
              Close
            </button>
          </div>
        </div>
      )}

      {/* Email Modal */}
      {showEmailModal && (
        <div style={styles.modal}>
          <div style={styles.modalContent}>
            {emailStep === 1 && (
              <>
                <h2>Code will be sent to your registered email</h2>
                <button style={styles.button} onClick={sendEmailCode}>
                  Send Code
                </button>
              </>
            )}
            {emailStep === 2 && (
              <>
                <h2>Verify Code</h2>
                <input
                  type="text"
                  placeholder="Enter verification code"
                  value={emailVerificationCode}
                  onChange={(e) => setEmailVerificationCode(e.target.value)}
                  style={styles.input}
                />
                <button style={styles.button} onClick={verifyEmailCode}>
                  Verify Code
                </button>
              </>
            )}
            {emailStep === 3 && (
              <>
                <h2>Enter New Email</h2>
                <input
                  type="email"
                  placeholder="Enter new email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  style={styles.input}
                />
                <button style={styles.button} onClick={submitNewEmail}>
                  Submit
                </button>
              </>
            )}
            <button style={styles.closeButton} onClick={() => setShowEmailModal(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Password Modal */}
      {showPasswordModal && (
        <div style={styles.modal}>
          <div style={styles.modalContent}>
            {passwordStep === 1 && (
              <>
                <h2>Verification code will be sent to your email</h2>
                <button style={styles.button} onClick={sendPasswordCode}>
                  Send Code
                </button>
              </>
            )}
            {passwordStep === 2 && (
              <>
                <h2>Verify Code</h2>
                <input
                  type="text"
                  placeholder="Enter verification code"
                  value={passwordVerificationCode}
                  onChange={(e) => setPasswordVerificationCode(e.target.value)}
                  style={styles.input}
                />
                <button style={styles.button} onClick={verifyPasswordCode}>
                  Verify Code
                </button>
              </>
            )}
            {passwordStep === 3 && (
              <>
                <h2>Enter New Password</h2>
                <div>
                  <input
                    type={passwordVisible ? 'text' : 'password'}
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    style={styles.input}
                  />
                  <button
                    style={styles.button}
                    onClick={() => setPasswordVisible(!passwordVisible)}
                  >
                    {passwordVisible ? 'Hide' : 'Show'}
                  </button>
                </div>
                <div>
                  <input
                    type={confirmPasswordVisible ? 'text' : 'password'}
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    style={styles.input}
                  />
                  <button
                    style={styles.button}
                    onClick={() => setConfirmPasswordVisible(!confirmPasswordVisible)}
                  >
                    {confirmPasswordVisible ? 'Hide' : 'Show'}
                  </button>
                </div>
                <button style={styles.button} onClick={updatePassword}>
                  Update Password
                </button>
              </>
            )}
            <button style={styles.closeButton} onClick={() => setShowPasswordModal(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div style={styles.modal}>
          <div style={styles.modalContent}>
            {deleteStep === 1 && (
              <>
                <h2>Delete Account</h2>
                <p>Click the button below to receive a verification code.</p>
                <button style={styles.button} onClick={sendDeleteCode}>
                  Send Code
                </button>
              </>
            )}
            {deleteStep === 2 && (
              <>
                <h2>Verify Code</h2>
                <input
                  type="text"
                  placeholder="Enter verification code"
                  value={deleteVerificationCode}
                  onChange={(e) => setDeleteVerificationCode(e.target.value)}
                  style={styles.input}
                />
                <button style={styles.button} onClick={verifyDeleteCode}>
                  Confirm
                </button>
              </>
            )}
            {deleteStep === 3 && (
              <>
                <h2>Reason for Deletion</h2>
                <textarea
                  placeholder="Enter reason for account deletion"
                  value={deletionReason}
                  onChange={(e) => setDeletionReason(e.target.value)}
                  style={{ ...styles.input, height: '100px' }}
                />
                <button style={styles.button} onClick={submitDeletionRequest}>
                  Submit Request
                </button>
              </>
            )}
            <button style={styles.closeButton} onClick={() => setShowDeleteModal(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Set;
