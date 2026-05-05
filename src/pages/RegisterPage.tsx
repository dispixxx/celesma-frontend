import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export default function RegisterPage() {
  const navigate = useNavigate();
  const register = useAuthStore((s) => s.register);
  const [form, setForm] = useState({
    email: '', password: '', firstName: '', lastName: '', nickname: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const update = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [field]: e.target.value });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);
    try {
      await register(form);
      navigate('/home');
    } catch (err: any) {
      const data = err.response?.data;
      if (typeof data === 'object') setErrors(data);
      else setErrors({ general: data?.message || 'Ошибка регистрации' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-logo">Celesma</div>
        <h1 className="auth-title">Регистрация</h1>

        {errors.general && <div className="auth-error">{errors.general}</div>}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Имя</label>
            <input className="auth-input" type="text" placeholder="Иван" value={form.firstName} onChange={update('firstName')} required />
            {errors.firstName && <span className="field-error">{errors.firstName}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">Фамилия</label>
            <input className="auth-input" type="text" placeholder="Иванов" value={form.lastName} onChange={update('lastName')} required />
            {errors.lastName && <span className="field-error">{errors.lastName}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">Никнейм</label>
            <input className="auth-input" type="text" placeholder="ivan123" value={form.nickname} onChange={update('nickname')} required />
            {errors.nickname && <span className="field-error">{errors.nickname}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="auth-input" type="email" placeholder="ivan@example.com" value={form.email} onChange={update('email')} required />
            {errors.email && <span className="field-error">{errors.email}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">Пароль</label>
            <input className="auth-input" type="password" placeholder="Минимум 4 символа" value={form.password} onChange={update('password')} required />
            <span className="password-hint">Минимум 4 символа</span>
            {errors.password && <span className="field-error">{errors.password}</span>}
          </div>

          <button className="auth-button" type="submit" disabled={loading}>
            {loading ? 'Регистрируем...' : 'Зарегистрироваться'}
          </button>
        </form>

        <div className="auth-footer">
          Уже есть аккаунт? <Link to="/login" className="auth-link">Войти</Link>
        </div>
      </div>
    </div>
  );
}
