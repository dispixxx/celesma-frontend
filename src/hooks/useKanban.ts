// src/hooks/useKanban.ts
import { useEffect, useRef, useState } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { tasksApi } from '../api/tasks';
import type { TaskResponse, TaskStatus } from '../types';

export function useKanban(projectId: number, onTaskUpdated?: (task: TaskResponse) => void) {
  const [tasks, setTasks] = useState<TaskResponse[]>([]);
  const [connected, setConnected] = useState(false);
  const clientRef = useRef<Client | null>(null);

  // Загрузка задач через REST
  useEffect(() => {
    tasksApi.getByProject(projectId).then(setTasks).catch(() => {});
  }, [projectId]);

  // WebSocket подключение
  useEffect(() => {
    const token = localStorage.getItem('token');

    const client = new Client({
      webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
      connectHeaders: { Authorization: `Bearer ${token ?? ''}` },
      reconnectDelay: 5000,

      onConnect: () => {
  setConnected(true);

  client.subscribe(`/topic/project/${projectId}/tasks`, (message) => {
    const updated: TaskResponse = JSON.parse(message.body);
    setTasks((prev) => prev.map((t) => t.id === updated.id ? updated : t));
    onTaskUpdated?.(updated);
  });
},

      onDisconnect: () => setConnected(false),
    });

    client.activate();
    clientRef.current = client;

    return () => { client.deactivate(); };
  }, [projectId]);

  // Смена статуса через WebSocket
  const changeStatus = (taskId: number, status: TaskStatus) => {
    if (!clientRef.current?.connected) return;
    clientRef.current.publish({
        destination: `/app/task/${taskId}/status`,
        body: JSON.stringify({ status }),
    });
};

  return { tasks, changeStatus, connected };
}