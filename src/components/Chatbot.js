import React, { useState, useRef, useEffect, useContext } from 'react';
import { getChatbotAnswer, sendMessageToAdmin } from "./chatbotApi";
import { BotVisibilityContext } from '../App';

const defaultPosition = { x: 20, y: 20 };

const getSavedPosition = () => {
  const saved = localStorage.getItem('chatbotPosition');
  return saved ? JSON.parse(saved) : defaultPosition;
};

const savePosition = (pos) => {
  localStorage.setItem('chatbotPosition', JSON.stringify(pos));
};

const isMobile = () => window.innerWidth <= 768;

const clampPosition = (x, y, open) => {
  const chatW = isMobile() ? (open ? Math.min(window.innerWidth - 16, 340) : 48) : (open ? 340 : 56);
  const chatH = isMobile() ? (open ? Math.min(window.innerHeight - 16, 420) : 48) : (open ? 420 : 56);
  const margin = 8;
  const maxX = window.innerWidth - chatW - margin;
  const maxY = window.innerHeight - chatH - margin;
  return {
    x: Math.max(margin, Math.min(x, maxX)),
    y: Math.max(margin, Math.min(y, maxY)),
  };
};

// Helper: Use logo image as bot head
const RobotHead = ({ onClick, dragging }) => {
  // Determine which side is closest to the window edge
  const [edge, setEdge] = React.useState('none');
  React.useEffect(() => {
    const updateEdge = () => {
      const margin = 8;
      const pos = window.localStorage.getItem('chatbotPosition') ? JSON.parse(window.localStorage.getItem('chatbotPosition')) : {x: 20, y: 20};
      const x = pos.x;
      const y = pos.y;
      const right = window.innerWidth - (x + 50 + margin);
      const bottom = window.innerHeight - (y + 50 + margin);
      const min = Math.min(x, y, right, bottom);
      if (min === x) setEdge('left');
      else if (min === y) setEdge('top');
      else if (min === right) setEdge('right');
      else setEdge('bottom');
    };
    updateEdge();
    window.addEventListener('resize', updateEdge);
    return () => window.removeEventListener('resize', updateEdge);
  }, []);

  let boxShadow = '0 2px 8px rgba(0,0,0,0.18)';
  if (edge === 'left') boxShadow = '-6px 0 12px 0 #2196f3, 0 2px 8px rgba(0,0,0,0.18)';
  else if (edge === 'right') boxShadow = '6px 0 12px 0 #2196f3, 0 2px 8px rgba(0,0,0,0.18)';
  else if (edge === 'top') boxShadow = '0 -6px 12px 0 #2196f3, 0 2px 8px rgba(0,0,0,0.18)';
  else if (edge === 'bottom') boxShadow = '0 6px 12px 0 #2196f3, 0 2px 8px rgba(0,0,0,0.18)';

  return (
    <div
      onClick={onClick}
      style={{
        width: 50,
        height: 50,
        borderRadius: '50%',
        background: dragging ? '#e0f7fa' : '#fff',
        boxShadow,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: dragging ? 'grabbing' : 'pointer',
        border: '3px solid #fff',
        zIndex: 10000,
        transition: 'background 0.2s, box-shadow 0.2s',
        overflow: 'hidden',
        padding: 0,
      }}
    >
      <img
        src={require('../tradespot-login.jpg')}
        alt="TradeSpot Bot"
        style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover', display: 'block' }}
      />
    </div>
  );
};

// Helper: Fetch extra context from backend for chatbot
export async function fetchChatbotContext(keywords) {
  const res = await fetch('/api/groq/context', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ keywords }),
  });
  if (!res.ok) return { summary: '', blocks: [] };
  return await res.json();
}

// Helper: Highlight code or docstring in chatbot answer
export function highlightRelevant(text, keywords) {
  let out = text;
  for (const k of keywords) {
    out = out.replace(new RegExp(`(${k})`, 'gi'), '<mark>$1</mark>');
  }
  return out;
}

const BOOSTED_SYSTEM_PROMPT = `You are TradeSpot Assistant AI. Your mission is to:
- Respond with warmth, empathy, and encouragement, as if you are a world-class human mentor.
- Use natural, conversational language, with a touch of personality and humor when appropriate.
- Give step-by-step, crystal-clear, and actionable guidance, referencing the UI and code as needed.
- Proactively anticipate user needs, clarify ambiguities, and offer extra tips or best practices.
- If the user is confused, reassure them and break down complex ideas into simple, relatable explanations.
- If you don't know, admit it honestly and suggest the best next step or where to get help.
- Always sound positive, supportive, and never robotic or generic.
- Use analogies, examples, and stories to make answers memorable and engaging.
- If the user is frustrated, acknowledge their feelings and offer encouragement.
- End answers with a friendly closing, invitation to ask more, or a motivational note.

You have access to the full, up-to-date code and documentation for the TradeSpot platform. Use it to ensure every answer is accurate, detailed, and user-focused. Your goal is to make every user feel understood, empowered, and delighted.`;

// Helper: Converts messages to a format for backend context
function formatChatHistory(messages) {
  // Only send last 15 messages for context (to avoid overloading prompt)
  return messages.slice(-15).map(m => ({ role: m.from === 'user' ? 'user' : 'assistant', content: m.text }));
}

const Chatbot = () => {
  const { showBot } = useContext(BotVisibilityContext);
  // Always call hooks first
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { from: 'bot', text: 'Hi! How can I help you today?' }
  ]);
  const [input, setInput] = useState('');
  const [position, setPosition] = useState(() => clampPosition(...Object.values(getSavedPosition()), false));
  const [dragging, setDragging] = useState(false);
  const [typing, setTyping] = useState(false); // NEW: typing indicator
  const offset = useRef({ x: 0, y: 0 });
  const botRef = useRef(null);

  // Only allow drag from the head
  const handleHeadDragStart = (e) => {
    setDragging(true);
    const rect = botRef.current.getBoundingClientRect();
    offset.current = {
      x: (e.touches ? e.touches[0].clientX : e.clientX) - rect.left,
      y: (e.touches ? e.touches[0].clientY : e.clientY) - rect.top
    };
    e.stopPropagation();
    e.preventDefault();
  };

  useEffect(() => {
    if (dragging) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [dragging]);

  useEffect(() => {
    const handleResize = () => {
      setPosition(pos => clampPosition(pos.x, pos.y, open));
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [open]);

  useEffect(() => {
    setPosition(pos => clampPosition(pos.x, pos.y, open));
  }, [open]);

  useEffect(() => {
    savePosition(position);
  }, [position]);

  useEffect(() => {
    const handleMove = (e) => {
      if (!dragging) return;
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      setPosition(pos => clampPosition(
        clientX - offset.current.x,
        clientY - offset.current.y,
        open
      ));
    };
    const handleUp = () => setDragging(false);
    if (dragging) {
      window.addEventListener(isMobile() ? 'touchmove' : 'mousemove', handleMove);
      window.addEventListener(isMobile() ? 'touchend' : 'mouseup', handleUp);
    }
    return () => {
      window.removeEventListener(isMobile() ? 'touchmove' : 'mousemove', handleMove);
      window.removeEventListener(isMobile() ? 'touchend' : 'mouseup', handleUp);
    };
  }, [dragging, open]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg = { from: 'user', text: input };
    setMessages(msgs => [...msgs, userMsg]);
    setInput('');
    setTyping(true);
    try {
      const userId = localStorage.getItem('userId') || 'anonymous';
      const systemPrompt = BOOSTED_SYSTEM_PROMPT;
      // Send full chat history for context
      const answer = await getChatbotAnswer({
        question: input,
        userId,
        systemPrompt,
        chatHistory: formatChatHistory([...messages, userMsg])
      });
      setMessages(msgs => [
        ...msgs,
        { from: 'bot', text: answer || "Sorry, I don't know the answer to that." }
      ]);
      setTyping(false);
    } catch (e) {
      setMessages(msgs => [
        ...msgs,
        { from: 'bot', text: "Sorry, I couldn't get an answer right now." }
      ]);
      setTyping(false);
    }
  };

  const handleEscalate = async () => {
    setMessages(msgs => [...msgs, { from: 'bot', text: 'Your message has been sent to an admin. Please wait for a response.' }]);
    const lastUserMsg = messages.filter(m => m.from === 'user').slice(-1)[0];
    if (!lastUserMsg) return;
    try {
      const sender = localStorage.getItem('userId') || 'anonymous';
      await sendMessageToAdmin({ text: lastUserMsg.text, sender });
    } catch (e) {
      setMessages(msgs => [...msgs, { from: 'bot', text: 'Failed to send message to admin.' }]);
    }
  };

  if (!showBot) return null;

  return (
    <>
      {/* Overlay to block page interaction while dragging */}
      {dragging && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            zIndex: 9998,
            background: 'rgba(0,0,0,0)',
            pointerEvents: 'auto',
          }}
        />
      )}
      <div
        id="tradespot-chatbot"
        ref={botRef}
        style={{
          position: 'fixed',
          left: position.x,
          top: position.y,
          zIndex: 9999,
          userSelect: 'none',
          width: open ? (isMobile() ? Math.min(window.innerWidth - 16, 340) : 340) : (isMobile() ? 48 : 56),
          height: open ? (isMobile() ? Math.min(window.innerHeight - 16, 420) : 420) : (isMobile() ? 48 : 56),
          minWidth: isMobile() ? 44 : 56,
          minHeight: isMobile() ? 44 : 56,
          maxWidth: isMobile() ? window.innerWidth - 16 : 340,
          maxHeight: isMobile() ? window.innerHeight - 16 : 420,
          transition: 'width 0.2s, height 0.2s',
          boxSizing: 'border-box',
        }}
      >
        {/* Robot Head (draggable only by head) */}
        <div
          className="robot-head"
          style={{ position: 'absolute', top: 0, left: 0, zIndex: 10001, cursor: dragging ? 'grabbing' : 'grab' }}
          onMouseDown={handleHeadDragStart}
          onTouchStart={handleHeadDragStart}
        >
          <RobotHead onClick={() => setOpen(o => !o)} dragging={dragging} />
        </div>
        {/* Chat window (only visible when open) */}
        {open && (
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: isMobile() ? 56 : 60, // Attach chat window right below the head
              width: isMobile() ? '100%' : 340,
              height: isMobile() ? `calc(100% - ${isMobile() ? 56 : 60}px)` : 360,
              background: '#fff',
              border: '1.5px solid #007bff',
              borderRadius: 18,
              boxShadow: '0 4px 24px rgba(0,0,0,0.18)',
              padding: 0,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              animation: 'fadeIn 0.2s',
              boxSizing: 'border-box',
            }}
          >
            <div style={{
              background: '#007bff',
              color: '#fff',
              padding: isMobile() ? '8px 10px' : '10px 16px',
              fontWeight: 600,
              fontSize: isMobile() ? 15 : 17,
              borderRadius: '18px 18px 0 0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              TradeSpot AI
              <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', color: '#fff', fontSize: isMobile() ? 18 : 22, cursor: 'pointer' }}>&times;</button>
            </div>
            <div style={{ flex: 1, padding: isMobile() ? 8 : 16, overflowY: 'auto', background: '#f7faff' }}>
              {messages.map((msg, i) => (
                <div key={i} style={{ textAlign: msg.from === 'user' ? 'right' : 'left', margin: isMobile() ? '6px 0' : '8px 0' }}>
                  <span style={{
                    display: 'inline-block',
                    background: msg.from === 'user' ? '#e6f7ff' : '#e9ecef',
                    color: '#222',
                    borderRadius: 8,
                    padding: isMobile() ? '6px 10px' : '8px 14px',
                    maxWidth: isMobile() ? 140 : 220,
                    wordBreak: 'break-word',
                    fontSize: isMobile() ? 13 : 15,
                  }} dangerouslySetInnerHTML={{ __html: msg.text }} />
                  {msg.text.includes('connect you to an admin') ? (
                    <button onClick={handleEscalate} style={{ marginLeft: 8, fontSize: isMobile() ? 11 : 13, background: '#007bff', color: '#fff', border: 'none', borderRadius: 4, padding: isMobile() ? '2px 6px' : '2px 10px', cursor: 'pointer' }}>Yes</button>
                  ) : null}
                </div>
              ))}
              {typing && (
                <div style={{ textAlign: 'left', margin: '8px 0', color: '#888', fontStyle: 'italic' }}>
                  TradeSpot is typing...
                </div>
              )}
            </div>
            <div style={{ display: 'flex', padding: isMobile() ? 8 : 12, borderTop: '1px solid #e3e3e3', background: '#f7faff' }}>
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSend()}
                style={{ flex: 1, borderRadius: 6, border: '1px solid #b3d1f7', padding: isMobile() ? 6 : 8, fontSize: isMobile() ? 13 : 15 }}
                placeholder="Type your question..."
              />
              <button onClick={handleSend} style={{ marginLeft: 8, borderRadius: 6, background: '#007bff', color: '#fff', border: 'none', padding: isMobile() ? '6px 12px' : '8px 18px', fontWeight: 600, fontSize: isMobile() ? 13 : 15 }}>Send</button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Chatbot;
