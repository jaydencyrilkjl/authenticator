import axios from "axios";

export async function getChatbotAnswer({ question, userId, systemPrompt, chatHistory }) {
  // Use the Groq backend for chatbot, now with systemPrompt and chatHistory for more human-like, contextual answers
  const res = await axios.post("https://tradespots.online/api/groq/ask", {
    question,
    userId,
    systemPrompt, // Pass the system prompt to backend
    chatHistory,  // Pass the full chat history for context
  });
  return res.data.answer;
}

export async function sendMessageToAdmin({ text, sender }) {
  const adminId = process.env.REACT_APP_ADMIN_ID || "ADMIN_USER_ID_HERE";
  try {
    const response = await axios.post(
      "https://tradespots.online/api/messages",
      {
        sender,
        receiver: adminId,
        text,
      }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
}

// Chatbot API: fetch context from backend for chatbot answers
export async function getChatbotContext(keywords) {
  const res = await fetch('/api/groq/context', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ keywords }),
  });
  if (!res.ok) return { summary: '', blocks: [] };
  return await res.json();
}
