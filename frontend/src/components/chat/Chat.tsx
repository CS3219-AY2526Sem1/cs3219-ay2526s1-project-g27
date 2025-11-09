// chat widget with yjs 
// include user id
// align self messages to the right
// make it scroll down when a new message arrives

import React, { useEffect, useState, useRef } from 'react';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { useAuth } from '@/context/AuthContext';

const WEBSOCKET_ENDPOINT = `ws://localhost/api/chat`;

interface CollaborativeChatProps {
  matchToken: string;
}

interface ChatMessage {
  userId: string;
  displayName: string,
  text: string;
}

export default function FloatingChat({ matchToken }: CollaborativeChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [displayName, setDisplayName] = useState<string>("");
  const [input, setInput] = useState('');
  const [isOpen, setIsOpen] = useState(true);
  const [matchState, setMatchState] = useState(true);
  const ydocRef = useRef<Y.Doc>(null);
  const yMessagesRef = useRef<Y.Array<ChatMessage>>(null);
  const providerRef = useRef<WebsocketProvider>(null);

  // For scrolling
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { user, jwt } = useAuth();

  useEffect(() => {
    if (!user || !jwt) {
      console.log("No Auth token");
      return;
    }
    setDisplayName(user.username || 'Anonymous' + Math.floor(Math.random() * 100))

    const ydoc = new Y.Doc();
    const provider = new WebsocketProvider(
      WEBSOCKET_ENDPOINT,
      matchToken,
      ydoc,
      { params: { userId: displayName, token: jwt } }
    );

    const yMessages = ydoc.getArray<ChatMessage>('messages');

    provider.ws?.addEventListener('close', event => {
      console.log('WebSocket closed:', event.code, event.reason);
      if (event.code === 3000) { // Match ended
        console.log("Match no longer in progress"); 
        localStorage.removeItem("matchToken");
        setMatchState(false);
        provider.destroy();
        ydoc.destroy();
      }
    });

    const updateMessages = () => setMessages([...yMessages.toArray()]);
    yMessages.observe(updateMessages);
    updateMessages();

    ydocRef.current = ydoc;
    yMessagesRef.current = yMessages;
    providerRef.current = provider;

    return () => {
      yMessages.unobserve(updateMessages);
      provider.disconnect();
      ydoc.destroy();
    };
  }, [user, jwt, matchToken]);

  // Scroll to bottom only if user is near the bottom
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const threshold = 50; // pixels from the bottom considered "near"
    const atBottom = container.scrollHeight - container.scrollTop - container.clientHeight < threshold;

    if (atBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const sendMessage = (msg: string) => {
    if (!msg.trim() || !user) return;
    yMessagesRef.current?.push([{ userId: user.id, displayName: displayName,text: msg }]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      sendMessage(input.trim());
      setInput('');
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        width: isOpen ? 300 : 60,
        height: isOpen ? 400 : 60,
        borderRadius: '10px',
        boxShadow: '0 4px 10px rgba(0,0,0,0.2)',
        backgroundColor: '#fff',
        overflow: 'hidden',
        transition: 'all 0.3s ease',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 9999,
      }}
    >
      {/* Header / Toggle */}
      <div
        onClick={() => matchState && setIsOpen(!isOpen)}
        style={{
          backgroundColor: '#007bff',
          color: '#fff',
          padding: '10px',
          cursor: 'pointer',
          fontWeight: 'bold',
          textAlign: 'center',
        }}
      >
        {isOpen ? 'Chat' : '💬'}
      </div>

      {/* Chat Body */}
      {matchState && isOpen && (
        <>
          <div
            ref={messagesContainerRef}
            style={{
              flex: 1,
              padding: '10px',
              overflowY: 'auto',
              backgroundColor: '#f9f9f9',
            }}
          >
            {messages.map((msg, i) => {
              const isSelf = msg.userId === user?.id;
              return (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    justifyContent: isSelf ? 'flex-end' : 'flex-start',
                    marginBottom: '6px',
                  }}
                >
                  <div
                    style={{
                      backgroundColor: isSelf ? '#007bff' : '#e0e0e0',
                      color: isSelf ? '#fff' : '#000',
                      padding: '8px 12px',
                      borderRadius: '12px',
                      maxWidth: '70%',
                      wordBreak: 'break-word',
                    }}
                  >
                    {!isSelf && <strong>{msg.displayName}:</strong>} {msg.text}
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form
            onSubmit={handleSubmit}
            style={{ display: 'flex', borderTop: '1px solid #ddd' }}
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type..."
              style={{
                flex: 1,
                padding: '8px',
                border: 'none',
                outline: 'none',
              }}
            />
            <button
              type="submit"
              style={{
                backgroundColor: '#007bff',
                color: '#fff',
                border: 'none',
                padding: '8px 12px',
                cursor: 'pointer',
              }}
            >
              Send
            </button>
          </form>
        </>
      )}

      {!matchState && (
        <p style={{ padding: '10px', textAlign: 'center' }}>Match has ended</p>
      )}
    </div>
  );
}
