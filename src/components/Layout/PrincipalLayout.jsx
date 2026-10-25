import { Link, useLocation, Outlet } from 'react-router-dom';
import { clsx } from 'clsx';
import { BarChart2, UserCheck, AlertCircle, Table2, GraduationCap, LogOut, Activity, ChevronRight } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import ThemeToggle from '../UI/ThemeToggle';

const NAV = [
  { to: '/principal',                              label: 'Report Home',          icon: BarChart2 },
  { to: '/principal/report/course-faculty-performance', label: 'Course Performance',  icon: BarChart2 },
  { to: '/principal/report/faculty-history',       label: 'Faculty History',      icon: UserCheck },
  { to: '/principal/report/supplementary-status',  label: 'Supplementary Status', icon: AlertCircle },
  { to: '/principal/report/program-semester',      label: 'Program & Semester',   icon: Table2 },
  { to: '/principal/report/graduation',            label: 'Graduation Stats',     icon: GraduationCap },
];

export default function PrincipalLayout() {
  const { pathname } = useLocation();
  const { user, logout } = useAuth();

  return (
    <div className="flex h-screen bg-mesh overflow-hidden">
      {/* Sidebar */}
      <div className="hidden md:flex w-60 shrink-0 flex-col glass border-r border-border">
        <div className="flex items-center gap-3 px-4 py-4 border-b border-border">
          <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center">
            <Activity size={18} className="text-accent" />
          </div>
          <span className="font-bold text-fg text-sm">Result Pro</span>
        </div>
        <nav className="flex-1 overflow-y-auto p-3 flex flex-col gap-0.5">
          <p className="text-[10px] font-semibold text-fg-muted uppercase tracking-widest px-3 pb-2">Reports</p>
          {NAV.map((item) => {
            const active = item.to === '/principal' ? pathname === '/principal' : pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={clsx(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all focus-ring',
                  active ? 'sidebar-active font-medium' : 'text-fg-muted hover:text-fg hover:bg-white/5'
                )}
              >
                <item.icon size={18} className="shrink-0" />
                <span className="truncate">{item.label}</span>
                {active && <ChevronRight size={14} className="ml-auto text-accent" />}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-border">
          <div className="px-3 py-2 text-xs text-fg-muted">
            <span className="text-fg font-medium">{user?.username}</span>
            <span className="ml-1 badge-info inline-flex items-center px-1.5 py-0.5 rounded text-[10px]">principal</span>
          </div>
          <button onClick={logout} className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-fg-muted hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer focus-ring w-full">
            <LogOut size={18} /> Logout
          </button>
        </div>
      </div>
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="glass border-b border-border px-4 py-3 flex justify-end shrink-0">
          <ThemeToggle />
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
