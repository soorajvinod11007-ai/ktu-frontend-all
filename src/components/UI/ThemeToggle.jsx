import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

export default function ThemeToggle({ className = '' }) {
  const { theme, toggleTheme } = useTheme();
  const isLight = theme === 'light';
  const label = `Switch to ${isLight ? 'dark' : 'light'} mode`;

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`inline-flex items-center justify-center gap-2 rounded-lg border border-border glass px-3 py-2 text-sm text-fg-muted hover:text-fg transition-colors focus-ring ${className}`}
      aria-label={label}
      title={label}
    >
      {isLight ? <Moon size={16} /> : <Sun size={16} />}
      <span className="sr-only">{label}</span>
    </button>
  );
}
