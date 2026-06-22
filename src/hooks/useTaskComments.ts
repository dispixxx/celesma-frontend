import { useEffect, useRef, useState } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { commentsApi } from '../api/comments';
import type { CommentResponse } from '../types';

export function useTaskComments(taskId: number) {
  const [comments, setComments] = useState<CommentResponse[]>([]);
  const [connected, setConnected] = useState(false);
  const clientRef = useRef<Client | null>(null);

  useEffect(() => {
    commentsApi.getByTask(taskId).then(setComments).catch(() => {});
  }, [taskId]);

  useEffect(() => {
    const token = localStorage.getItem('token');

    const client = new Client({
      webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
      connectHeaders: {
        Authorization: `Bearer ${token ?? ''}`,
      },
      reconnectDelay: 5000,

      onConnect: () => {
        setConnected(true);
        client.subscribe(`/topic/task/${taskId}/comments`, (message) => {
          const comment: CommentResponse = JSON.parse(message.body);
          setComments((prev) => [comment, ...prev]);
        });
      },

      onDisconnect: () => setConnected(false),
    });

    client.activate();
    clientRef.current = client;

    return () => {
      client.deactivate();
    };
  }, [taskId]);

  const sendComment = (text: string) => {
    if (!clientRef.current?.connected) return;
    clientRef.current.publish({
      destination: `/app/task/${taskId}/comment`,
      body: JSON.stringify({ text }),
    });
  };

  return { comments, sendComment, connected };
}