import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Activity, Lock, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { Button, Input } from '../components/UI/index';
import ThemeToggle from '../components/UI/ThemeToggle';

export default function Login() {
  const [selectedRole, setSelectedRole] = useState('admin');
  const [form, setForm] = useState({ username: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const handleRoleChange = (role) => {
    setSelectedRole(role);
    if (!form.username || form.username === 'admin' || form.username === 'principal') {
      setForm((f) => ({ ...f, username: role }));
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.username || !form.password) { setError('All fields are required.'); return; }
    setLoading(true);
    try {
      const user = await login(form.username, form.password);
      toast('Welcome back!', 'success');
      navigate(user.role === 'admin' ? '/admin' : '/principal', { replace: true });
    } catch (err) {
      const msg = err.response?.data?.error?.message || 'Invalid credentials.';
      setError(msg);
      toast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-mesh flex items-center justify-center p-4">
      <ThemeToggle className="absolute right-4 top-4" />
      {/* Background blobs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-sm relative z-10 animate-slide-up">
        {/* Logo */}
        <div className="flex flex-col items-center gap-3 mb-8">
          <div className="w-14 h-14 rounded-2xl bg-accent/15 border border-accent/30 flex items-center justify-center shadow-glow">
            <Activity size={28} className="text-accent" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-fg">Result Analytics</h1>
            <p className="text-sm text-fg-muted mt-1">Nirmala College Of Engineering And Technology</p>
          </div>
        </div>

        {/* Card */}
        <div className="glass rounded-2xl p-7 flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-fg">Sign in to continue</h2>
          </div>

          {/* Role Selection Tabs */}
          <div className="flex rounded-xl p-1 bg-muted/60 border border-border">
            <button
              type="button"
              onClick={() => handleRoleChange('admin')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                selectedRole === 'admin'
                  ? 'bg-accent text-background shadow-sm'
                  : 'text-fg-muted hover:text-fg'
              }`}
            >
              Admin Portal
            </button>
            <button
              type="button"
              onClick={() => handleRoleChange('principal')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                selectedRole === 'principal'
                  ? 'bg-accent text-background shadow-sm'
                  : 'text-fg-muted hover:text-fg'
              }`}
            >
              Principal Portal
            </button>
          </div>

          {error && (
            <div className="badge-danger rounded-lg px-4 py-3 text-sm flex items-center gap-2">
              <Lock size={14} /> {error}
            </div>
          )}

          <form onSubmit={submit} className="flex flex-col gap-4">
            <Input
              label="Username"
              icon={User}
              type="text"
              placeholder={`Enter ${selectedRole} username`}
              value={form.username}
              onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
              autoComplete="username"
              autoFocus
            />
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-fg-muted uppercase tracking-wider">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-muted pointer-events-none" />
                <input
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

            <Button type="submit" loading={loading} className="w-full mt-1" size="lg">
              {loading ? 'Signing in…' : `Sign in as ${selectedRole === 'admin' ? 'Admin' : 'Principal'}`}
            </Button>
          </form>

          <div className="flex gap-2 text-xs text-center">
            <div
              onClick={() => handleRoleChange('admin')}
              className={`flex-1 glass rounded-lg p-3 border cursor-pointer transition-colors ${
                selectedRole === 'admin' ? 'border-accent bg-accent/5' : 'border-border hover:border-accent/40'
              }`}
            >
              <p className="text-fg font-semibold">Admin</p>
              <p className="text-fg-muted text-[11px] mt-0.5">Full CRUD & Uploads</p>
            </div>
            <div
              onClick={() => handleRoleChange('principal')}
              className={`flex-1 glass rounded-lg p-3 border cursor-pointer transition-colors ${
                selectedRole === 'principal' ? 'border-accent bg-accent/5' : 'border-border hover:border-accent/40'
              }`}
            >
              <p className="text-fg font-semibold">Principal</p>
              <p className="text-fg-muted text-[11px] mt-0.5">Analytics & Reports</p>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-fg-muted mt-6">
          NICE College · Academic Management
        </p>
      </div>
    </div>
  );
}
