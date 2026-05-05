import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { projectsApi } from '../api/projects';
import MainLayout from '../components/layout/MainLayout';

export default function ProjectNewPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', description: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    if (!form.name.trim()) { setErrors({ name: 'Название не может быть пустым' }); return; }
    if (!form.description.trim()) { setErrors({ description: 'Описание не может быть пустым' }); return; }
    setLoading(true);
    try {
      const project = await projectsApi.create(form);
      navigate(`/projects/${project.id}`);
    } catch (err: any) {
      setErrors(err.response?.data || { general: 'Ошибка создания проекта' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="new-project-wrapper">
        <div className="new-project-card">
          <h1 className="page-title">Новый проект</h1>

          {errors.general && <div className="auth-error">{errors.general}</div>}

          <form className="new-project-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Название <span className="required">*</span></label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Название проекта"
                maxLength={100}
              />
              {errors.name && <small className="error">{errors.name}</small>}
            </div>

            <div className="form-group">
              <label>Описание <span className="required">*</span></label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Описание проекта"
                rows={4}
                maxLength={500}
              />
              {errors.description && <small className="error">{errors.description}</small>}
            </div>

            <div className="form-actions">
              <Link to="/home" className="btn-secondary">Отмена</Link>
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Создаём...' : 'Создать проект'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </MainLayout>
  );
}
