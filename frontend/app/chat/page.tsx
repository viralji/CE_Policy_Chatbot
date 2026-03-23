'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Bot, User, Send, LogOut } from 'lucide-react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';

type Message = {
  id: number;
  text: string | string[];
  sources?: { file: string; page?: number; link: string }[];
  sender: 'user' | 'bot';
  timestamp: Date;
};

export default function ChatPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [devBypass, setDevBypass] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: 'Hi! I\'m your CloudExtel Assistant. Ask me anything about your company policies!',
      sender: 'bot',
      timestamp: new Date(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const hasDevCookie = document.cookie.includes('dev-bypass-auth=true');
    setDevBypass(!!(isLocalhost && hasDevCookie));
  }, []);

  const isAuthenticated = !!(session?.user || devBypass);

  useEffect(() => {
    if (status === 'loading' && !devBypass) return;
    if (devBypass) return;
    if (session?.user) return;
    if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') && document.cookie.includes('dev-bypass-auth=true')) {
      setDevBypass(true);
      return;
    }
    router.replace('/signin');
  }, [session, status, router, devBypass]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now(),
      text: inputMessage,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ question: userMessage.text }),
      });

      const data = await response.json().catch(() => ({}));

      if (response.ok) {
        const botMessage: Message = {
          id: Date.now() + 1,
          text: data.response ?? [],
          sources: (data.sources ?? []).map((s: { file: string; page?: number }) => ({
            ...s,
            link: `/api/files/${s.file}${s.page ? `#page=${s.page}` : ''}`,
          })),
          sender: 'bot',
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, botMessage]);
      } else if (response.status === 401 || response.status === 403) {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now() + 1,
            text: data.error || 'Please sign in again. Try logging out and back in.',
            sender: 'bot',
            timestamp: new Date(),
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now() + 1,
            text: data.error ? `Sorry, I encountered an error: ${data.error}` : 'Sorry, an unexpected error occurred.',
            sender: 'bot',
            timestamp: new Date(),
          },
        ]);
      }
    } catch (error) {
      console.error('Network error:', error);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          text: 'Sorry, I\'m having trouble connecting to the server. Please try again.',
          sender: 'bot',
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    if (devBypass) {
      document.cookie = 'dev-bypass-auth=; path=/; max-age=0';
      router.push('/signin');
    } else {
      signOut({ callbackUrl: '/signin' });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!isAuthenticated) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#000', color: '#fff' }}>
        <p style={{ color: '#888' }}>Loading...</p>
      </div>
    );
  }

  return (
    <div
      style={{
        height: '100vh',
        width: '100vw',
        backgroundColor: '#000',
        color: '#fff',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      <header
        style={{
          backgroundColor: '#111',
          borderBottom: '1px solid #333',
          padding: '16px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 32, height: 32, backgroundColor: '#3b82f6', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Bot size={20} color="#fff" />
          </div>
          <h1 style={{ fontSize: 20, fontWeight: 600, margin: 0 }}>CloudExtel Assistant</h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 13, color: '#999', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {devBypass ? 'Dev User' : ((session?.user as { email?: string } | undefined)?.email ?? session?.user?.name ?? 'User')}
          </span>
          <button
            type="button"
            onClick={handleLogout}
            title="Sign out"
            style={{
              width: 36,
              height: 36,
              backgroundColor: 'transparent',
              border: '1px solid #444',
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#999',
            }}
          >
            <LogOut size={18} />
          </button>
        </div>
      </header>

      <div style={{ flex: 1, overflowY: 'auto', padding: 24, backgroundColor: '#000' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          {messages.map((message) => (
            <div
              key={message.id}
              style={{
                display: 'flex',
                justifyContent: message.sender === 'user' ? 'flex-end' : 'flex-start',
                marginBottom: 16,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 12,
                  maxWidth: '70%',
                  flexDirection: message.sender === 'user' ? 'row-reverse' : 'row',
                }}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    backgroundColor: message.sender === 'user' ? '#3b82f6' : '#333',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {message.sender === 'user' ? <User size={16} color="#fff" /> : <Bot size={16} color="#ccc" />}
                </div>
                <div
                  style={{
                    backgroundColor: message.sender === 'user' ? '#3b82f6' : '#1a1a1a',
                    color: message.sender === 'user' ? '#fff' : '#e5e5e5',
                    padding: '12px 16px',
                    borderRadius: 16,
                    borderBottomLeftRadius: message.sender === 'user' ? 16 : 4,
                    borderBottomRightRadius: message.sender === 'user' ? 4 : 16,
                    border: message.sender === 'user' ? 'none' : '1px solid #333',
                    fontSize: 14,
                    lineHeight: 1.4,
                  }}
                >
                  {message.sender === 'bot' && Array.isArray(message.text) ? (
                    <div>
                      <ul style={{ margin: 0, paddingLeft: '1.2em' }}>
                        {message.text.map((point, i) => (
                          <li key={i}>{point}</li>
                        ))}
                      </ul>
                      {message.sources && message.sources.length > 0 && (
                        <div style={{ marginTop: 10, paddingTop: 8, borderTop: '1px solid #333', fontSize: 12, color: '#888' }}>
                          <span style={{ fontWeight: 600, color: '#aaa' }}>Sources: </span>
                          {message.sources.map((src, i) => (
                            <span key={i}>
                              {i > 0 && <span style={{ margin: '0 4px' }}>·</span>}
                              <a href={src.link} target="_blank" rel="noopener noreferrer" style={{ color: '#63b2f6', textDecoration: 'underline' }}>
                                {src.file}{src.page ? ` p.${src.page}` : ''}
                              </a>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    String(message.text)
                  )}
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, maxWidth: '70%' }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', backgroundColor: '#333', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Bot size={16} color="#ccc" />
                </div>
                <div style={{ backgroundColor: '#1a1a1a', border: '1px solid #333', padding: '12px 16px', borderRadius: 16, borderBottomLeftRadius: 4, display: 'flex', gap: 4 }}>
                  <div style={{ width: 8, height: 8, backgroundColor: '#666', borderRadius: '50%', animation: 'bounce 1.4s infinite ease-in-out' }} />
                  <div style={{ width: 8, height: 8, backgroundColor: '#666', borderRadius: '50%', animation: 'bounce 1.4s infinite ease-in-out', animationDelay: '0.16s' }} />
                  <div style={{ width: 8, height: 8, backgroundColor: '#666', borderRadius: '50%', animation: 'bounce 1.4s infinite ease-in-out', animationDelay: '0.32s' }} />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      <div
        style={{
          backgroundColor: '#111',
          borderTop: '1px solid #333',
          padding: '16px 24px',
          position: 'sticky',
          bottom: 0,
          zIndex: 10,
        }}
      >
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12 }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your message..."
                style={{
                  width: '100%',
                  backgroundColor: '#222',
                  border: '1px solid #444',
                  borderRadius: 20,
                  padding: '12px 50px 12px 16px',
                  color: '#fff',
                  fontSize: 14,
                  outline: 'none',
                  resize: 'none',
                  minHeight: 44,
                  maxHeight: 120,
                  fontFamily: 'inherit',
                  boxSizing: 'border-box',
                }}
                rows={1}
              />
              <button
                type="button"
                onClick={sendMessage}
                disabled={!inputMessage.trim() || isLoading}
                style={{
                  position: 'absolute',
                  right: 8,
                  bottom: 8,
                  width: 32,
                  height: 32,
                  backgroundColor: !inputMessage.trim() || isLoading ? '#444' : '#3b82f6',
                  border: 'none',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: !inputMessage.trim() || isLoading ? 'not-allowed' : 'pointer',
                }}
              >
                <Send size={16} color="#fff" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
