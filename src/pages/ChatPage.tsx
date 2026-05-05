import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { useAuthStore } from '../store/authStore';
import api from '../api/client';

interface ChatMessage {
  id: number;
  senderUsername: string;
  senderAvatarUrl: string | null;
  content: string;
  timestamp: string;
}

export default function ChatPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const username = useAuthStore((s) => s.username);
  const token = useAuthStore((s) => s.token);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [connected, setConnected] = useState(false);
  const clientRef = useRef<Client | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.get(`/projects/${projectId}/chat/history`)
      .then((r) => setMessages(r.data))
      .catch(() => {});

    const client = new Client({
      webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
      connectHeaders: { Authorization: `Bearer ${token}` },
      onConnect: () => {
        setConnected(true);
        client.subscribe(`/topic/projects/${projectId}/chat`, (msg) => {
          setMessages((prev) => [...prev, JSON.parse(msg.body)]);
        });
        client.publish({ destination: `/app/projects/${projectId}/online/join`, body: '' });
      },
      onDisconnect: () => setConnected(false),
    });

    client.activate();
    clientRef.current = client;

    return () => {
      client.publish({ destination: `/app/projects/${projectId}/online/leave`, body: '' });
      client.deactivate();
    };
  }, [projectId, token]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !clientRef.current?.connected) return;
    clientRef.current.publish({
      destination: `/app/projects/${projectId}/chat`,
      body: JSON.stringify({ content: input.trim() }),
    });
    setInput('');
  };

  return (
    <div className="chat-fullpage">
      <div className="chat-header">
        <button className="btn-back" onClick={() => navigate(`/projects/${projectId}`)}>
          <span className="material-icons">arrow_back</span>
        </button>
        <span>Чат проекта</span>
        <span style={{ fontSize: '0.8rem', color: connected ? 'var(--status-completed)' : 'var(--text-secondary)' }}>
          {connected ? '● Подключено' : '○ Подключение...'}
        </span>
      </div>

      <div className="chat-layout">
        <div className="chat-main">
          <div className="chat-messages">
            {messages.map((msg) => (
              <div key={msg.id} className={`chat-message ${msg.senderUsername === username ? 'own' : 'other'}`}>
                {msg.senderUsername !== username && (
                  <div className="chat-message-sender">{msg.senderUsername}</div>
                )}
                {msg.content}
                <div className="chat-message-time">
                  {new Date(msg.timestamp).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <form className="chat-input-area" onSubmit={sendMessage}>
            <input
              type="text"
              placeholder="Введите сообщение..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={!connected}
            />
            <button type="submit" className="btn-send" disabled={!connected || !input.trim()}>
              <span className="material-icons">send</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
