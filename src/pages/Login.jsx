import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, User, ShieldCheck, GraduationCap } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { Button } from '../components/UI/index';
import ThemeToggle from '../components/UI/ThemeToggle';

const ROLES = [
  {
    key: 'admin',
    label: 'Admin',
    icon: ShieldCheck,
    accent: 'from-emerald-500 to-teal-600',
    accentBg: 'bg-emerald-500/10',
    accentBorder: 'border-emerald-500/30',
    accentText: 'text-emerald-500',
    accentGlow: 'shadow-emerald-500/20',
    desc: 'Full system access — CRUD, uploads & analytics',
    redirect: '/admin',
  },
  {
    key: 'principal',
    label: 'Principal',
    icon: GraduationCap,
    accent: 'from-blue-500 to-indigo-600',
    accentBg: 'bg-blue-500/10',
    accentBorder: 'border-blue-500/30',
    accentText: 'text-blue-500',
    accentGlow: 'shadow-blue-500/20',
    desc: 'Reports & analytics — read-only dashboard',
    redirect: '/principal',
  },
];

export default function Login() {
  const [activeRole, setActiveRole] = useState('admin');
  const [form, setForm] = useState({ username: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const role = ROLES.find((r) => r.key === activeRole);

  const handleRoleSwitch = (key) => {
    setActiveRole(key);
    setError('');
    setForm({ username: '', password: '' });
    setShowPw(false);
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.username || !form.password) {
      setError('Please fill in all fields.');
      return;
    }
    setLoading(true);
    try {
      const user = await login(form.username, form.password);
      // Validate that the user's actual role matches the selected tab
      if (user.role !== activeRole) {
        setError(`These credentials belong to a ${user.role} account. Please use the correct login tab.`);
        toast(`Wrong login portal selected.`, 'error');
        return;
      }
      toast(`Welcome back, ${user.username || user.role}!`, 'success');
      navigate(role.redirect, { replace: true });
    } catch (err) {
      const msg = err.response?.data?.error?.message || 'Invalid credentials. Please try again.';
      setError(msg);
      toast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-mesh flex items-center justify-center p-4 relative overflow-hidden">
      <ThemeToggle className="absolute right-4 top-4 z-20" />

      {/* Ambient blobs */}
      <div
        className={`absolute top-1/4 left-1/3 w-[32rem] h-[32rem] rounded-full blur-3xl pointer-events-none transition-all duration-700 opacity-40 ${
          activeRole === 'admin' ? 'bg-emerald-500/10' : 'bg-blue-500/10'
        }`}
      />
      <div
        className={`absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full blur-3xl pointer-events-none transition-all duration-700 opacity-30 ${
          activeRole === 'admin' ? 'bg-teal-500/10' : 'bg-indigo-500/10'
        }`}
      />

      <div className="w-full max-w-md relative z-10 animate-slide-up">
        {/* Header */}
        <div className="flex flex-col items-center gap-3 mb-8">
          <div
            className={`w-16 h-16 rounded-2xl border flex items-center justify-center shadow-lg transition-all duration-500 ${role.accentBg} ${role.accentBorder} ${role.accentGlow}`}
          >
            <role.icon size={30} className={`${role.accentText} transition-all duration-300`} />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-fg">Result Analytics</h1>
            <p className="text-sm text-fg-muted mt-1">Nirmala College Of Engineering And Technology</p>
          </div>
        </div>

        {/* Role Tab Switcher */}
        <div className="flex gap-2 p-1.5 glass rounded-2xl border border-border mb-6 relative">
          {ROLES.map((r) => (
            <button
              key={r.key}
              onClick={() => handleRoleSwitch(r.key)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all duration-300 focus-ring ${
                activeRole === r.key
                  ? `bg-gradient-to-r ${r.accent} text-white shadow-md`
                  : 'text-fg-muted hover:text-fg hover:bg-white/5'
              }`}
              id={`tab-${r.key}`}
              aria-selected={activeRole === r.key}
              role="tab"
            >
              <r.icon size={16} />
              {r.label}
            </button>
          ))}
        </div>

        {/* Login Card */}
        <div className="glass rounded-2xl p-7 flex flex-col gap-5 border border-border">
          {/* Role description */}
          <div className={`flex items-start gap-3 rounded-xl p-3.5 border ${role.accentBg} ${role.accentBorder}`}>
            <role.icon size={18} className={`${role.accentText} mt-0.5 shrink-0`} />
            <div>
              <p className={`text-sm font-semibold ${role.accentText}`}>{role.label} Portal</p>
              <p className="text-xs text-fg-muted mt-0.5">{role.desc}</p>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="badge-danger rounded-lg px-4 py-3 text-sm flex items-center gap-2">
              <Lock size={14} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={submit} className="flex flex-col gap-4" id={`form-${activeRole}`}>
            {/* Username */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-fg-muted uppercase tracking-wider" htmlFor="username">
                Username
              </label>
              <div className="relative">
                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-muted pointer-events-none" />
                <input
                  id="username"
                  type="text"
                  placeholder={`Enter ${role.label.toLowerCase()} username`}
                  value={form.username}
                  onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
                  autoComplete="username"
                  autoFocus
                  className="w-full glass rounded-lg px-3 py-2 pl-9 text-sm text-fg placeholder-fg-muted border border-border focus:border-accent focus:outline-none transition-colors focus-ring"
                />
              </div>
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-fg-muted uppercase tracking-wider" htmlFor="password">
                Password
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-muted pointer-events-none" />
                <input
                  id="password"
                  type={showPw ? 'text' : 'password'}
                  placeholder="Enter password"
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  autoComplete="current-password"
                  className="w-full glass rounded-lg px-3 py-2 pl-9 pr-10 text-sm text-fg placeholder-fg-muted border border-border focus:border-accent focus:outline-none transition-colors focus-ring"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-fg-muted hover:text-fg cursor-pointer focus-ring rounded"
                  aria-label={showPw ? 'Hide password' : 'Show password'}
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full mt-1 py-2.5 rounded-xl font-semibold text-sm text-white bg-gradient-to-r ${role.accent} hover:opacity-90 active:scale-[0.98] transition-all duration-200 shadow-md focus-ring disabled:opacity-60 disabled:cursor-not-allowed`}
              id={`submit-${activeRole}`}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
                  </svg>
                  Signing in…
                </span>
              ) : (
                `Sign in as ${role.label}`
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-fg-muted mt-6">
          NICE College · Academic Management System
        </p>
      </div>
    </div>
  );
}
