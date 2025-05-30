import React, { useState, useEffect } from "react";

const Store = () => {
  const [input, setInput] = useState("");
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [editId, setEditId] = useState(null);
  const [editValue, setEditValue] = useState("");

  // Fetch items from backend
  const API_BASE = "https://tradespots.online/api/admin";
  const fetchItems = async (query = "") => {
    setLoading(true);
    setError("");
    try {
      const url = query.trim()
        ? `${API_BASE}/store?q=${encodeURIComponent(query)}`
        : `${API_BASE}/store`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch items");
      const data = await res.json();
      setItems(data);
    } catch (err) {
      setError("Error loading items");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  // Search effect
  useEffect(() => {
    const delay = setTimeout(() => {
      fetchItems(search);
    }, 400);
    return () => clearTimeout(delay);
  }, [search]);

  const handleSave = async () => {
    if (!input.trim()) return;
    // Check for duplicate in current items (case-insensitive, trimmed)
    const exists = items.some(
      (item) => item.value.trim().toLowerCase() === input.trim().toLowerCase()
    );
    if (exists) {
      setError("Duplicate records");
      return;
    }
    setLoading(true);
    setError("");
    try {
      // Update endpoint to correct path
      const res = await fetch(`${API_BASE}/store`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value: input })
      });
      if (!res.ok) throw new Error("Error saving item");
      setInput("");
      fetchItems();
    } catch (err) {
      setError("Error saving item");
    } finally {
      setLoading(false);
    }
  };

  // Delete a record
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this record?")) return;
    setLoading(true);
    setError("");
    try {
      // Update endpoint to correct path
      const res = await fetch(`${API_BASE}/store/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Error deleting item");
      fetchItems();
    } catch (err) {
      setError("Error deleting item");
    } finally {
      setLoading(false);
    }
  };

  // Start editing
  const startEdit = (item) => {
    setEditId(item._id);
    setEditValue(item.value);
    setError("");
  };

  // Save edit
  const handleEditSave = async (id) => {
    if (!editValue.trim()) {
      setError("Value cannot be empty");
      return;
    }
    // Prevent duplicate on edit
    const exists = items.some(
      (item) => item.value.trim().toLowerCase() === editValue.trim().toLowerCase() && item._id !== id
    );
    if (exists) {
      setError("Duplicate records");
      return;
    }
    setLoading(true);
    setError("");
    try {
      // Update endpoint to correct path
      const res = await fetch(`${API_BASE}/store/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value: editValue })
      });
      if (!res.ok) throw new Error("Error updating item");
      setEditId(null);
      fetchItems();
    } catch (err) {
      setError("Error updating item");
    } finally {
      setLoading(false);
    }
  };

  // Cancel edit
  const handleEditCancel = () => {
    setEditId(null);
    setEditValue("");
    setError("");
  };

  // Copy to clipboard
  const handleCopy = (value) => {
    navigator.clipboard.writeText(value);
    setError("Copied!");
    setTimeout(() => setError(""), 1000);
  };

  return (
    <div style={{ fontFamily: "Arial, sans-serif", background: "#121212", color: "#fff", minHeight: "100vh", position: "relative" }}>
      <div
        className="admin-store-container"
        style={{
          width: "100%",
          maxWidth: 500,
          margin: "40px auto",
          padding: 24,
          background: "linear-gradient(135deg, #004d00, #b8860b)",
          color: "#fff",
          borderRadius: 12,
          boxShadow: "0 2px 12px #0006",
          boxSizing: 'border-box',
          minWidth: 0
        }}
      >
        <button
          onClick={() => window.location.href = '/admindb'}
          style={{
            marginBottom: 18,
            background: "#222",
            color: "#fff",
            border: "1.5px solid #b8860b",
            borderRadius: 8,
            padding: "10px 22px",
            fontWeight: 700,
            fontSize: 16,
            cursor: "pointer",
            boxShadow: "2px 2px 8px #0004",
            transition: "background 0.3s, color 0.3s"
          }}
        >
          ← Back to Admin Dashboard
        </button>
        <h2 style={{ textAlign: "center", marginBottom: 24, textShadow: "2px 2px 5px rgba(0,0,0,0.5)", fontWeight: 700, fontSize: "2em", letterSpacing: 1, background: "#222", color: "#fff", borderRadius: 8, padding: "10px 0" }}>Admin Store</h2>
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Enter text, digits, words..."
            style={{ flex: 1, padding: 12, borderRadius: 8, border: "1.5px solid #b8860b", background: "#222", color: "#fff", fontSize: 16, fontWeight: 500 }}
            disabled={loading}
          />
          <button
            onClick={handleSave}
            style={{ padding: "12px 24px", borderRadius: 8, background: "#b8860b", color: "#fff", border: "none", fontWeight: 700, fontSize: 16, boxShadow: "2px 2px 8px #0004", cursor: "pointer", transition: "background 0.3s" }}
            disabled={loading}
          >Save</button>
        </div>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search saved details..."
          style={{ width: "100%", padding: 12, borderRadius: 8, border: "1.5px solid #b8860b", background: "#222", color: "#fff", marginBottom: 20, fontSize: 16 }}
          disabled={loading}
        />
        {error && <div style={{ color: "#ffb300", marginBottom: 10, fontWeight: 600, textAlign: "center" }}>{error}</div>}
        {loading ? (
          <div style={{ color: "#aaa", textAlign: "center" }}>Loading...</div>
        ) : (
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {items.length === 0 ? (
              <li style={{ color: "#aaa", textAlign: "center", padding: 16 }}>No results found.</li>
            ) : null}
            {items.map((item) => (
              <li
                key={item._id}
                className="admin-store-list-item"
                style={{
                  padding: "12px 0",
                  borderBottom: "1.5px solid #333",
                  fontSize: 16,
                  fontWeight: 500,
                  letterSpacing: 0.5,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  flexWrap: 'wrap',
                  minHeight: 48
                }}
              >
                {editId === item._id ? [
                  <input
                    key="edit-input"
                    value={editValue}
                    onChange={e => setEditValue(e.target.value)}
                    style={{
                      flex: 1,
                      minWidth: 0,
                      padding: 8,
                      borderRadius: 6,
                      border: "1.5px solid #b8860b",
                      background: "#222",
                      color: "#fff",
                      fontSize: 16,
                      marginBottom: 8,
                      width: '100%',
                      boxSizing: 'border-box'
                    }}
                    disabled={loading}
                  />,
                  <div key="edit-btns" style={{ display: 'flex', gap: 8, width: '100%', flexWrap: 'wrap' }}>
                    <button onClick={() => handleEditSave(item._id)} style={{ background: '#004d00', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 14px', fontWeight: 700, cursor: 'pointer', flex: 1, minWidth: 90, marginBottom: 4 }} disabled={loading}>Save</button>
                    <button onClick={handleEditCancel} style={{ background: '#b8860b', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 14px', fontWeight: 700, cursor: 'pointer', flex: 1, minWidth: 90, marginBottom: 4 }} disabled={loading}>Cancel</button>
                  </div>
                ] : [
                  <span key="val" style={{ flex: 1, wordBreak: 'break-all', minWidth: 0 }}>{item.value}</span>,
                  <button key="copy" onClick={() => handleCopy(item.value)} style={{ background: '#222', color: '#b8860b', border: 'none', borderRadius: 6, padding: '6px 10px', fontWeight: 700, cursor: 'pointer', minWidth: 70 }}>Copy</button>,
                  <button key="edit" onClick={() => startEdit(item)} style={{ background: '#004d00', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 10px', fontWeight: 700, cursor: 'pointer', minWidth: 70 }}>Edit</button>,
                  <button key="del" onClick={() => handleDelete(item._id)} style={{ background: '#b8860b', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 10px', fontWeight: 700, cursor: 'pointer', minWidth: 70 }}>Delete</button>
                ]}
              </li>
            ))}
          </ul>
        )}
      </div>
      <style>{`
@media (max-width: 600px) {
  .admin-store-container {
    padding: 8px !important;
    max-width: 100vw !important;
  }
  .admin-store-list-item {
    flex-direction: column !important;
    align-items: stretch !important;
    gap: 4px !important;
  }
  .admin-store-list-item button, .admin-store-list-item input {
    width: 100% !important;
    min-width: 0 !important;
    margin-bottom: 4px !important;
  }
}`}</style>
    </div>
  );
};

export default Store;
