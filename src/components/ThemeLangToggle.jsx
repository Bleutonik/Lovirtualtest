import { useTheme } from '../context/ThemeContext';
import { useLang } from '../context/LangContext';

export default function ThemeLangToggle() {
  const { isDark, toggleTheme } = useTheme();
  const { language, toggleLanguage } = useLang();

  return (
    <div style={{
      position: 'fixed',
      bottom: 20,
      right: 20,
      zIndex: 999,
      display: 'flex',
      alignItems: 'center',
      gap: 4,
      background: 'var(--surface-2)',
      border: '1px solid var(--border-md)',
      borderRadius: 12,
      padding: '5px 8px',
      boxShadow: '0 4px 20px rgba(0,0,0,.35)',
      backdropFilter: 'blur(8px)',
    }}>
      <button
        onClick={toggleTheme}
        title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          fontSize: '1rem',
          lineHeight: 1,
          padding: '4px 6px',
          borderRadius: 8,
          color: 'var(--text-muted)',
          transition: 'background .15s, color .15s',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = 'var(--border-md)'; e.currentTarget.style.color = 'var(--text)'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--text-muted)'; }}
      >
        {isDark ? '☀️' : '🌙'}
      </button>

      <div style={{ width: 1, height: 16, background: 'var(--border-md)' }} />

      <button
        onClick={toggleLanguage}
        title={language === 'es' ? 'Switch to English' : 'Cambiar a Español'}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          fontSize: '.75rem',
          fontWeight: 700,
          letterSpacing: '.04em',
          padding: '4px 6px',
          borderRadius: 8,
          color: 'var(--text-muted)',
          transition: 'background .15s, color .15s',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = 'var(--border-md)'; e.currentTarget.style.color = 'var(--text)'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--text-muted)'; }}
      >
        {language === 'es' ? 'EN' : 'ES'}
      </button>
    </div>
  );
}
