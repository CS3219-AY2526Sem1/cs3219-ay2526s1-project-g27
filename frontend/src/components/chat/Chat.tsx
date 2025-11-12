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
    <div className={`fixed bottom-5 right-5 
                  flex flex-col
                  bg-white 
                  rounded-[10px]
                  shadow-[0_4px_10px_rgba(0,0,0,0.2)]
                  overflow-hidden
                  transition-all duration-300 ease-in-out
                  z-[9999]
                  ${isOpen ? 'w-[300px] h-100' : 'w-15 h-15'}
                `}
    >
      {/* Header / Toggle */}
      <div
        onClick={() => matchState && setIsOpen(!isOpen)}
        className="bg-chatbar text-white p-2.5 cursor-pointer font-bold text-center"
      >
        {isOpen ? 'Chat' : '💬'}
      </div>

      {/* Chat Body */}
      {matchState && isOpen && (
        <>
          <div
            ref={messagesContainerRef}
            className="flex-1 p-2.5 overflow-y-auto bg-[#f9f9f9]"
          >
            {messages.map((msg, i) => {
              const isSelf = msg.userId === user?.id;
              return (
                <div
                  key={i}
                  className={`flex mb-1.5 ${isSelf ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`py-2 px-3 rounded-xl max-w-[70%] break-word 
                      ${isSelf ? 'bg-chatbar text-white' : 'bg-[#e0e0e0] text-black'}`}
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
            className="flex border-t border-[#ddd]"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type..."
              className="flex-1 p-2 border-none outline-none focus:ring-0"
            />
            <button
              type="submit"
              className="bg-chatbar text-white border-none py-2 px-3 cursor-pointer hover:bg-opacity-90"
            >
              Send
            </button>
          </form>
        </>
      )}

      {!matchState && (
        <p className="p-2.5 text-center">Match has ended</p>
      )}
    </div>
  );
}
