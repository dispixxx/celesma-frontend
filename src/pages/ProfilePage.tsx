import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/client';
import MainLayout from '../components/layout/MainLayout';
import Alert, { useAlert } from '../components/ui/Alert';
import { useAuthStore } from '../store/authStore';

interface UserProfile {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  bio: string | null;
  registrationDate: string;
}

export default function ProfilePage() {
  const { username } = useParams<{ username: string }>();
  const currentUsername = useAuthStore((state) => state.username);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [form, setForm] = useState({ firstName: '', lastName: '', bio: '' });
  const { alert, showAlert, hideAlert } = useAlert();
  const isOwnProfile = currentUsername && currentUsername === username;

  useEffect(() => {
    api.get(`/users/${username}`)
      .then((r) => {
        setUser(r.data);
        setForm({ firstName: r.data.firstName || '', lastName: r.data.lastName || '', bio: r.data.bio || '' });
      })
      .catch(() => showAlert('Ошибка загрузки профиля', 'error'))
      .finally(() => setLoading(false));
  }, [username]);

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const r = await api.put(`/users/profile`, form);
      setUser(r.data);
      setEditOpen(false);
      showAlert('Профиль обновлён', 'success');
    } catch {
      showAlert('Ошибка сохранения', 'error');
    }
  };

  const initials = user?.username ? user.username.slice(0, 2).toUpperCase() : '?';

  if (loading) return <MainLayout><div className="empty-state"><p>Загрузка...</p></div></MainLayout>;
  if (!user) return <MainLayout><div className="empty-state"><p>Пользователь не найден</p></div></MainLayout>;

  return (
    <MainLayout>
      {alert && <Alert message={alert.message} type={alert.type} onClose={hideAlert} />}

      <div className="profile-container">
        <div className="profile-header">
          <div className="profile-avatar-container">
            <div className="water-ring" />
            <div className="avatar-pulse-ring" />
            <div className="profile-avatar">
              {user.avatarUrl
                ? <img src={user.avatarUrl} alt={user.username} />
                : <span>{initials}</span>
              }
            </div>
          </div>

          <h1 className="profile-name">@{user.username}</h1>
          {(user.firstName || user.lastName) && (
            <p className="profile-fullname">{user.firstName} {user.lastName}</p>
          )}
          <p className="profile-email">{user.email}</p>

          <div className="profile-actions">
            {isOwnProfile && (
              <button className="btn-primary" onClick={() => setEditOpen(true)}>
                <span className="material-icons">edit</span>
                Редактировать
              </button>
            )}
          </div>
        </div>

        <div className="profile-details">
          {user.bio && (
            <div className="detail-item">
              <span className="detail-label">О себе</span>
              <span className="detail-value">{user.bio}</span>
            </div>
          )}
          <div className="detail-item">
            <span className="detail-label">Дата регистрации</span>
            <span className="detail-value">{user.registrationDate}</span>
          </div>
        </div>
      </div>

      {isOwnProfile && editOpen && (
        <div className="profile-modal" onClick={(e) => { if (e.target === e.currentTarget) setEditOpen(false); }}>
          <div className="profile-modal-content">
            <h2>Редактировать профиль</h2>
            <form onSubmit={saveProfile}>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label>Имя</label>
                <input type="text" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
              </div>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label>Фамилия</label>
                <input type="text" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
              </div>
              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label>О себе</label>
                <textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
              </div>
              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={() => setEditOpen(false)}>Отмена</button>
                <button type="submit" className="btn-primary">Сохранить</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </MainLayout>
  );
}