'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Bot, User, Send, LogOut } from 'lucide-react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { FormattedBotMessage } from '@/components/FormattedBotMessage';

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
    <div className="chat-root">
      <header className="chat-header">
        <div className="chat-header-brand">
          <div className="chat-avatar chat-avatar--bot" aria-hidden>
            <Bot size={18} color="#fff" />
          </div>
          <h1 className="chat-header-title">CloudExtel Assistant</h1>
        </div>
        <div className="chat-header-actions">
          <span className="chat-header-email" title={devBypass ? 'Dev User' : ((session?.user as { email?: string } | undefined)?.email ?? session?.user?.name ?? 'User')}>
            {devBypass ? 'Dev User' : ((session?.user as { email?: string } | undefined)?.email ?? session?.user?.name ?? 'User')}
          </span>
          <button
            type="button"
            onClick={handleLogout}
            title="Sign out"
            className="chat-logout-btn"
            aria-label="Sign out"
          >
            <LogOut size={20} />
          </button>
        </div>
      </header>

      <div className="chat-log">
        <div className="chat-log-inner">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`chat-msg-row ${message.sender === 'user' ? 'chat-msg-row--user' : 'chat-msg-row--bot'}`}
            >
              <div className="chat-msg-wrap">
                <div
                  className={`chat-avatar ${message.sender === 'user' ? 'chat-avatar--user' : 'chat-avatar--bot'}`}
                  aria-hidden
                >
                  {message.sender === 'user' ? <User size={16} color="#fff" /> : <Bot size={16} color="#ccc" />}
                </div>
                <div className={`chat-bubble ${message.sender === 'user' ? 'chat-bubble--user' : 'chat-bubble--bot'}`}>
                  {message.sender === 'bot' && Array.isArray(message.text) ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {message.text.map((point, i) => (
                        <FormattedBotMessage key={i} content={String(point)} />
                      ))}
                      {message.sources && message.sources.length > 0 && (
                        <div className="chat-sources">
                          <span className="chat-sources-label">Sources </span>
                          {message.sources.map((src, i) => (
                            <span key={i}>
                              {i > 0 && <span style={{ margin: '0 4px' }}>·</span>}
                              <a href={src.link} target="_blank" rel="noopener noreferrer" className="chat-source-link">
                                {src.file}{src.page ? ` p.${src.page}` : ''}
                              </a>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : message.sender === 'bot' ? (
                    <FormattedBotMessage content={String(message.text)} />
                  ) : (
                    String(message.text)
                  )}
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="chat-msg-row chat-msg-row--bot">
              <div className="chat-msg-wrap">
                <div className="chat-avatar chat-avatar--bot" aria-hidden>
                  <Bot size={16} color="#ccc" />
                </div>
                <div className="chat-bubble chat-bubble--bot chat-bubble--typing">
                  <div className="chat-typing-row">
                    <div className="chat-typing-dot" />
                    <div className="chat-typing-dot chat-typing-dot--2" />
                    <div className="chat-typing-dot chat-typing-dot--3" />
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="chat-composer">
        <div className="chat-composer-inner">
          <div className="chat-textarea-wrap">
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about policies…"
              className="chat-textarea"
              rows={1}
              enterKeyHint="send"
              autoComplete="off"
              autoCorrect="on"
            />
            <button
              type="button"
              onClick={sendMessage}
              disabled={!inputMessage.trim() || isLoading}
              className="chat-send-btn"
              aria-label="Send message"
            >
              <Send size={18} color="#fff" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
