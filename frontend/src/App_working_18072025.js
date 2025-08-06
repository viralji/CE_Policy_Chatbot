import React, { useState, useRef, useEffect } from 'react';
import { Bot, User, Send } from 'lucide-react';

const App = () => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hi! I'm your CloudExtel Assistant. Ask me anything about your company policies!",
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const API_BASE_URL = 'http://localhost:5000/api';

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage = {
      id: Date.now(),
      text: inputMessage,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: userMessage.text })
      });

      if (response.ok) {
        const data = await response.json();
        const botMessage = {
          id: Date.now() + 1,
          text: data.response,
          sender: 'bot',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, botMessage]);
      } else {
        const errorData = await response.json();
        setMessages(prev => [...prev, {
          id: Date.now() + 1,
          text: `Sorry, I encountered an error: ${errorData.error}`,
          sender: 'bot',
          timestamp: new Date()
        }]);
      }
    } catch (error) {
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        text: 'Sorry, I\'m having trouble connecting to the server. Please try again.',
        sender: 'bot',
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div 
      style={{
        height: '100vh',
        width: '100vw',
        backgroundColor: '#000000',
        color: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}
    >
      {/* Fixed Header */}
      <div 
        style={{
          backgroundColor: '#111111',
          borderBottom: '1px solid #333333',
          padding: '16px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          zIndex: 10
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div 
            style={{
              width: '32px',
              height: '32px',
              backgroundColor: '#3b82f6',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Bot size={20} color="#ffffff" />
          </div>
          <h1 style={{ fontSize: '20px', fontWeight: '600', margin: 0 }}>
            CloudExtel Assistant
          </h1>
        </div>
        <div 
          style={{
            width: '40px',
            height: '40px',
            backgroundColor: '#333333',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '14px',
            fontWeight: '500',
            color: '#999999'
          }}
        >
          CE
        </div>
      </div>

      {/* Messages Container */}
      <div 
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '24px',
          backgroundColor: '#000000'
        }}
      >
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          {messages.map((message) => (
            <div 
              key={message.id} 
              style={{
                display: 'flex',
                justifyContent: message.sender === 'user' ? 'flex-end' : 'flex-start',
                marginBottom: '16px'
              }}
            >
              <div 
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  maxWidth: '70%',
                  flexDirection: message.sender === 'user' ? 'row-reverse' : 'row'
                }}
              >
                <div 
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    backgroundColor: message.sender === 'user' ? '#3b82f6' : '#333333',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}
                >
                  {message.sender === 'user' ? (
                    <User size={16} color="#ffffff" />
                  ) : (
                    <Bot size={16} color="#cccccc" />
                  )}
                </div>
                <div 
                  style={{
                    backgroundColor: message.sender === 'user' ? '#3b82f6' : '#1a1a1a',
                    color: message.sender === 'user' ? '#ffffff' : '#e5e5e5',
                    padding: '12px 16px',
                    borderRadius: '16px',
                    borderBottomLeftRadius: message.sender === 'user' ? '16px' : '4px',
                    borderBottomRightRadius: message.sender === 'user' ? '4px' : '16px',
                    border: message.sender === 'user' ? 'none' : '1px solid #333333',
                    fontSize: '14px',
                    lineHeight: '1.4'
                  }}
                >
                  {message.text}
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', maxWidth: '70%' }}>
                <div 
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    backgroundColor: '#333333',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Bot size={16} color="#cccccc" />
                </div>
                <div 
                  style={{
                    backgroundColor: '#1a1a1a',
                    border: '1px solid #333333',
                    padding: '12px 16px',
                    borderRadius: '16px',
                    borderBottomLeftRadius: '4px',
                    display: 'flex',
                    gap: '4px'
                  }}
                >
                  <div 
                    style={{
                      width: '8px',
                      height: '8px',
                      backgroundColor: '#666666',
                      borderRadius: '50%',
                      animation: 'bounce 1.4s infinite ease-in-out'
                    }}
                  />
                  <div 
                    style={{
                      width: '8px',
                      height: '8px',
                      backgroundColor: '#666666',
                      borderRadius: '50%',
                      animation: 'bounce 1.4s infinite ease-in-out',
                      animationDelay: '0.16s'
                    }}
                  />
                  <div 
                    style={{
                      width: '8px',
                      height: '8px',
                      backgroundColor: '#666666',
                      borderRadius: '50%',
                      animation: 'bounce 1.4s infinite ease-in-out',
                      animationDelay: '0.32s'
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Fixed Input Area */}
      <div 
        style={{
          backgroundColor: '#111111',
          borderTop: '1px solid #333333',
          padding: '16px 24px',
          position: 'sticky',
          bottom: 0,
          zIndex: 10
        }}
      >
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '12px' }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                style={{
                  width: '100%',
                  backgroundColor: '#222222',
                  border: '1px solid #444444',
                  borderRadius: '20px',
                  padding: '12px 50px 12px 16px',
                  color: '#ffffff',
                  fontSize: '14px',
                  outline: 'none',
                  resize: 'none',
                  minHeight: '44px',
                  maxHeight: '120px',
                  fontFamily: 'inherit',
                  boxSizing: 'border-box'
                }}
                rows={1}
                onFocus={(e) => {
                  e.target.style.borderColor = '#3b82f6';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#444444';
                }}
              />
              <button
                onClick={sendMessage}
                disabled={!inputMessage.trim() || isLoading}
                style={{
                  position: 'absolute',
                  right: '8px',
                  bottom: '8px',
                  width: '32px',
                  height: '32px',
                  backgroundColor: !inputMessage.trim() || isLoading ? '#444444' : '#3b82f6',
                  border: 'none',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: !inputMessage.trim() || isLoading ? 'not-allowed' : 'pointer',
                  transition: 'background-color 0.2s'
                }}
                onMouseOver={(e) => {
                  if (!(!inputMessage.trim() || isLoading)) {
                    e.target.style.backgroundColor = '#2563eb';
                  }
                }}
                onMouseOut={(e) => {
                  if (!(!inputMessage.trim() || isLoading)) {
                    e.target.style.backgroundColor = '#3b82f6';
                  }
                }}
              >
                <Send size={16} color="#ffffff" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* CSS Animation */}
      <style>
        {`
          @keyframes bounce {
            0%, 80%, 100% { transform: scale(0); }
            40% { transform: scale(1); }
          }
        `}
      </style>
    </div>
  );
};

export default App;