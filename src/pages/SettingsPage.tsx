import { useState } from 'react';
import MainLayout from '../components/layout/MainLayout';
import Alert, { useAlert } from '../components/ui/Alert';
import { setTheme, setFontSize, getTheme, getFontSize, type Theme, type FontSize } from '../hooks/useTheme';

export default function SettingsPage() {
  const [theme, setThemeState] = useState<Theme>(getTheme());
  const [fontSize, setFontSizeState] = useState<FontSize>(getFontSize());
  const { alert, showAlert, hideAlert } = useAlert();

  const handleTheme = (t: Theme) => {
    setTheme(t);
    setThemeState(t);
    showAlert('Тема изменена', 'success');
  };

  const handleFontSize = (s: FontSize) => {
    setFontSize(s);
    setFontSizeState(s);
    showAlert('Размер шрифта изменён', 'success');
  };

  const themes: { value: Theme; label: string }[] = [
    { value: 'light',    label: 'Светлая' },
    { value: 'dark',     label: 'Тёмная' },
    { value: 'monodark', label: 'Моно-тёмная' },
    { value: 'mirror',   label: 'Зеркало' },
    { value: 'cosmic',   label: 'Космос' },
  ];

  const fontSizes: { value: FontSize; label: string }[] = [
    { value: 'small',  label: 'Маленький' },
    { value: 'medium', label: 'Средний' },
    { value: 'large',  label: 'Большой' },
  ];

  return (
    <MainLayout>
      {alert && <Alert message={alert.message} type={alert.type} onClose={hideAlert} />}

      <div className="settings-container">
        <h1 className="settings-title">Настройки</h1>

        <div className="settings-card">
          <h2>Внешний вид</h2>

          <div className="select-label">
            <span>Тема</span>
            <select value={theme} onChange={(e) => handleTheme(e.target.value as Theme)}>
              {themes.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          <div className="select-label">
            <span>Размер шрифта</span>
            <select value={fontSize} onChange={(e) => handleFontSize(e.target.value as FontSize)}>
              {fontSizes.map((f) => (
                <option key={f.value} value={f.value}>{f.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="settings-card">
          <h2>Уведомления Telegram</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem', fontSize: '0.95rem' }}>
            Привяжите Telegram для получения уведомлений о задачах
          </p>
          <button
            className="btn-primary"
            onClick={() => showAlert('Функция Telegram доступна в основном приложении', 'info')}
          >
            Получить код привязки
          </button>
        </div>
      </div>
    </MainLayout>
  );
}
