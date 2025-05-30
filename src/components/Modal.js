import React from "react";

const Modal = ({ children, onClose }) => (
  <div style={{
    position: "fixed",
    top: 0,
    left: 0,
    width: "100vw",
    height: "100vh",
    background: "rgba(0,0,0,0.4)",
    zIndex: 2000,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  }}
    onClick={onClose}
  >
    <div
      style={{ background: "#fff", borderRadius: 10, boxShadow: "0 4px 24px rgba(0,0,0,0.2)", position: "relative" }}
      onClick={e => e.stopPropagation()}
    >
      {children}
      <button
        onClick={onClose}
        style={{
          position: "absolute",
          top: 8,
          right: 8,
          background: "#dc3545",
          color: "#fff",
          border: "none",
          borderRadius: "50%",
          width: 28,
          height: 28,
          fontWeight: "bold",
          cursor: "pointer",
        }}
        aria-label="Close"
      >
        ×
      </button>
    </div>
  </div>
);

export default Modal;
