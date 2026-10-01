import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Loader } from 'lucide-react';
import api from '../services/api';

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { text: "Bonjour ! Je suis l'expert IA d'AgriVision. Posez-moi vos questions sur les plantes et maladies !", isBot: true }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = input.trim();
    setMessages(prev => [...prev, { text: userMessage, isBot: false }]);
    setInput("");
    setLoading(true);

    try {
      const response = await api.post('chat/', { message: userMessage });
      setMessages(prev => [...prev, { text: response.data.reply, isBot: true }]);
    } catch (error) {
      setMessages(prev => [...prev, { text: "Désolé, une erreur s'est produite lors de la connexion à l'IA.", isBot: true }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 1000 }}>
      {!isOpen && (
        <button 
          onClick={() => setIsOpen(true)}
          style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'var(--color-primary)', color: 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.2)', transition: 'transform 0.2s' }}
          onMouseOver={e => e.currentTarget.style.transform = 'scale(1.1)'}
          onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
        >
          <MessageCircle size={30} />
        </button>
      )}

      {isOpen && (
        <div className="glass-card animate-fade-in" style={{ width: '350px', height: '500px', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 10px 25px rgba(0,0,0,0.5)', padding: 0 }}>
          <div style={{ padding: '1rem', background: 'rgba(16, 185, 129, 0.2)', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <MessageCircle size={20} color="var(--color-primary)" />
              <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'white' }}>Expert IA</h3>
            </div>
            <button onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer' }}>
              <X size={20} />
            </button>
          </div>

          <div style={{ flex: 1, padding: '1rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {messages.map((msg, idx) => (
              <div key={idx} style={{ alignSelf: msg.isBot ? 'flex-start' : 'flex-end', maxWidth: '85%', padding: '0.75rem 1rem', borderRadius: '12px', background: msg.isBot ? 'rgba(255,255,255,0.05)' : 'var(--color-primary)', color: 'white', fontSize: '0.9rem', lineHeight: '1.4' }}>
                {msg.text}
              </div>
            ))}
            {loading && (
              <div style={{ alignSelf: 'flex-start', padding: '0.75rem 1rem', borderRadius: '12px', background: 'rgba(255,255,255,0.05)' }}>
                <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} color="var(--color-primary)" />
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSend} style={{ padding: '1rem', borderTop: '1px solid var(--color-border)', display: 'flex', gap: '0.5rem' }}>
            <input 
              type="text" 
              placeholder="Posez votre question..." 
              value={input} 
              onChange={(e) => setInput(e.target.value)}
              style={{ flex: 1, padding: '0.75rem', borderRadius: '100px', border: '1px solid var(--color-border)', background: 'rgba(255,255,255,0.05)', color: 'white', outline: 'none', fontSize: '0.9rem' }}
            />
            <button type="submit" disabled={loading || !input.trim()} style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--color-primary)', color: 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: (loading || !input.trim()) ? 0.5 : 1 }}>
              <Send size={18} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
