import React from "react";
import ReactDOM from "react-dom";
import "./StyledAlert.css";

const StyledAlert = ({ message, onClose }) => {
  return ReactDOM.createPortal(
    <div className="styled-alert-overlay">
      <div className="styled-alert">
        <p>{message}</p>
        <button onClick={onClose}>OK</button>
      </div>
    </div>,
    document.body
  );
};

export default StyledAlert;
