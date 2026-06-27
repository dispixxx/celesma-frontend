import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useTheme } from './hooks/useTheme';
import PrivateRoute from './components/PrivateRoute';
import MemberRoute from './components/MemberRoute';

import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import HomePage from './pages/HomePage';
import ProjectSearchPage from './pages/ProjectSearchPage';
import ProjectNewPage from './pages/ProjectNewPage';
import ProjectViewPage from './pages/ProjectViewPage';
import ProjectSettingsPage from './pages/ProjectSettingsPage';
import TaskListPage from './pages/TaskListPage';
import TaskNewPage from './pages/TaskNewPage';
import TaskViewPage from './pages/TaskViewPage';
import TaskEditPage from './pages/TaskEditPage';
import KanbanPage from './pages/KanbanPage';
import RoadmapPage from './pages/RoadmapPage';
import ChatPage from './pages/ChatPage';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';
import ProjectStatsPage from './pages/ProjectStatsPage';

export default function App() {
  useTheme();

  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Private — general */}
        <Route path="/home" element={<PrivateRoute><HomePage /></PrivateRoute>} />
        <Route path="/settings" element={<PrivateRoute><SettingsPage /></PrivateRoute>} />
        <Route path="/profile/:username" element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
        <Route path="/projects/search" element={<PrivateRoute><ProjectSearchPage /></PrivateRoute>} />
        <Route path="/projects/new" element={<PrivateRoute><ProjectNewPage /></PrivateRoute>} />

        {/* Доступно всем авторизованным — главная страница проекта и заявки */}
        <Route path="/projects/:projectId" element={<PrivateRoute><ProjectViewPage /></PrivateRoute>} />

        {/* Только участникам проекта */}
        <Route path="/projects/:projectId/settings" element={<PrivateRoute><MemberRoute><ProjectSettingsPage /></MemberRoute></PrivateRoute>} />
        <Route path="/projects/:projectId/tasks" element={<PrivateRoute><MemberRoute><TaskListPage /></MemberRoute></PrivateRoute>} />
        <Route path="/projects/:projectId/tasks/new" element={<PrivateRoute><MemberRoute><TaskNewPage /></MemberRoute></PrivateRoute>} />
        <Route path="/projects/:projectId/tasks/:taskId" element={<PrivateRoute><MemberRoute><TaskViewPage /></MemberRoute></PrivateRoute>} />
        <Route path="/projects/:projectId/tasks/:taskId/edit" element={<PrivateRoute><MemberRoute><TaskEditPage /></MemberRoute></PrivateRoute>} />
        <Route path="/projects/:projectId/kanban" element={<PrivateRoute><MemberRoute><KanbanPage /></MemberRoute></PrivateRoute>} />
        <Route path="/projects/:projectId/roadmap" element={<PrivateRoute><MemberRoute><RoadmapPage /></MemberRoute></PrivateRoute>} />
        <Route path="/projects/:projectId/chat" element={<PrivateRoute><MemberRoute><ChatPage /></MemberRoute></PrivateRoute>} />
        <Route path="/projects/:projectId/stats" element={<PrivateRoute><MemberRoute><ProjectStatsPage /></MemberRoute></PrivateRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
