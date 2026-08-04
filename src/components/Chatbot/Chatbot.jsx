import { useState, useRef, useEffect } from 'react';
import { chatWithAI } from '../../services/groqService';
import './Chatbot.css';

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('chat_history') || '[]');
    } catch {
      return [];
    }
  });
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusText, setStatusText] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    localStorage.setItem('chat_history', JSON.stringify(messages));
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = { role: 'user', content: input.trim() };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setLoading(true);
    setStatusText('Analyzing request...');

    try {
      // Send empty history to AI so each chat starts fresh as requested
      const response = await chatWithAI(userMessage.content, [], (status) => setStatusText(status));
      
      let finalContent = response;
      let finalImageUrls = [];
      if (typeof response === 'object' && response !== null && !Array.isArray(response)) {
        finalContent = response.text;
        finalImageUrls = response.imageUrls || [];
      }
      
      setMessages([...newMessages, { role: 'assistant', content: finalContent, imageUrls: finalImageUrls }]);
    } catch (err) {
      setMessages([...newMessages, { role: 'assistant', content: 'Error: Could not fetch response. ' + err.message }]);
    } finally {
      setLoading(false);
      setStatusText('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const clearChat = () => {
    setMessages([]);
    localStorage.removeItem('chat_history');
  };

  return (
    <div className={`chatbot-wrapper ${isOpen ? 'open' : ''}`}>
      {!isOpen && (
        <button className="chatbot-toggle" onClick={() => setIsOpen(true)}>
          💬 AI Assistant
        </button>
      )}

      {isOpen && (
        <div className="chatbot-window glass-card animate-scale-in">
          <div className="chatbot-header">
            <div className="chatbot-title">
              <span>🤖</span> UPSC Assistant
            </div>
            <div className="chatbot-actions">
              <button className="btn-icon" onClick={clearChat} title="Clear Chat">🗑️</button>
              <button className="btn-icon" onClick={() => setIsOpen(false)} title="Close">✕</button>
            </div>
          </div>

          <div className="chatbot-messages">
            {messages.length === 0 && (
              <div className="chatbot-empty">
                <p>Hello! I am your UPSC AI Assistant. Ask me anything about the syllabus, exam patterns, or concepts!</p>
              </div>
            )}
            {messages.map((msg, idx) => (
              <div key={idx} className={`chat-message ${msg.role}`}>
                <div className="chat-bubble" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {msg.imageUrls && msg.imageUrls.length > 0 && (
                    <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
                      {msg.imageUrls.map((url, i) => (
                        <img 
                          key={i}
                          src={url} 
                          alt={`Search Result ${i+1}`} 
                          style={{ width: '200px', height: '150px', borderRadius: '8px', objectFit: 'cover', flexShrink: 0 }} 
                        />
                      ))}
                    </div>
                  )}
                  <span>{msg.content}</span>
                </div>
              </div>
            ))}
            {loading && (
              <div className="chat-message assistant">
                <div className="chat-bubble typing" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '8px' }}>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <span className="dot"></span>
                    <span className="dot"></span>
                    <span className="dot"></span>
                  </div>
                  {statusText && <span style={{ fontSize: '0.8rem', opacity: 0.8 }}>{statusText}</span>}
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="chatbot-input-area">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Ask a question..."
              rows={1}
            />
            <button className="btn btn-primary" onClick={handleSend} disabled={loading || !input.trim()}>
              ➤
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
