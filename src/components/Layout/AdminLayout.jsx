import { useState } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { clsx } from 'clsx';
import {
  LayoutDashboard, Users, GraduationCap, BookOpen, Layers,
  UserCheck, FlaskConical, Calendar, FileText, BarChart2,
  Upload, History, AlertTriangle, Settings, LogOut, Menu, X,
  ChevronRight, Activity, BookMarked, ClipboardList
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import ThemeToggle from '../UI/ThemeToggle';

const NAV = [
  { section: 'Overview' },
  { to: '/admin',            label: 'Dashboard',        icon: LayoutDashboard },
  { section: 'Records' },
  { to: '/admin/students',   label: 'Students',         icon: GraduationCap },
  { to: '/admin/faculty',    label: 'Faculty',          icon: UserCheck },
  { to: '/admin/programs',   label: 'Programs',         icon: BookMarked },
  { to: '/admin/batches',    label: 'Batches',          icon: Layers },
  { to: '/admin/divisions',  label: 'Divisions',        icon: Layers },
  { to: '/admin/subjects',   label: 'Subjects',         icon: BookOpen },
  { section: 'Academic' },
  { to: '/admin/course-offerings', label: 'Course Offerings', icon: Calendar },
  { to: '/admin/exam-sessions',    label: 'Exam Sessions',    icon: FlaskConical },
  { to: '/admin/results',          label: 'Results',          icon: BarChart2 },
  { to: '/admin/grade-cards',      label: 'Grade Cards',      icon: FileText },
  { section: 'Files' },
  { to: '/admin/upload',     label: 'Upload Files',     icon: Upload },
  { to: '/admin/upload-logs',label: 'Upload History',   icon: History },
  { section: 'Alerts' },
  { to: '/admin/flagged',    label: 'Flagged Students', icon: AlertTriangle },
  { section: 'Management' },
  { to: '/admin/users',      label: 'Users',            icon: Users },
];

function NavItem({ item, collapsed }) {
  const { pathname } = useLocation();
  const active = item.to === '/admin' ? pathname === '/admin' : pathname.startsWith(item.to);

  return (
    <Link
      to={item.to}
      className={clsx(
        'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-200 focus-ring',
        active ? 'sidebar-active font-medium' : 'text-fg-muted hover:text-fg hover:bg-white/5'
      )}
      title={collapsed ? item.label : undefined}
    >
      <item.icon size={18} className="shrink-0" />
      {!collapsed && <span className="truncate">{item.label}</span>}
      {!collapsed && active && <ChevronRight size={14} className="ml-auto text-accent" />}
    </Link>
  );
}

export default function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout } = useAuth();

  const sidebar = (
    <div className={clsx(
      'flex flex-col h-full glass border-r border-border transition-all duration-300',
      collapsed ? 'w-16' : 'w-60'
    )}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-border">
        <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center shrink-0">
          <Activity size={18} className="text-accent" />
        </div>
        {!collapsed && <span className="font-bold text-fg text-sm">Result Pro</span>}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto p-3 flex flex-col gap-0.5">
        {NAV.map((item, i) => {
          if (item.section) {
            return !collapsed ? (
              <p key={i} className="text-[10px] font-semibold text-fg-muted uppercase tracking-widest px-3 pt-4 pb-1 first:pt-1">
                {item.section}
              </p>
            ) : <div key={i} className="my-2 border-t border-border/50" />;
          }
          return <NavItem key={item.to} item={item} collapsed={collapsed} />;
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-border flex flex-col gap-1">
        {!collapsed && (
          <div className="px-3 py-2 text-xs text-fg-muted truncate">
            <span className="text-fg font-medium">{user?.username}</span>
            <span className="ml-1 badge-success inline-flex items-center px-1.5 py-0.5 rounded text-[10px]">admin</span>
          </div>
        )}
        <button
          onClick={logout}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-fg-muted hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer focus-ring"
        >
          <LogOut size={18} />
          {!collapsed && 'Logout'}
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-mesh overflow-hidden">
      {/* Desktop sidebar */}
      <div className="hidden md:flex shrink-0">
        {sidebar}
      </div>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <div className="relative w-60 h-full">{sidebar}</div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="glass border-b border-border px-4 py-3 flex items-center gap-3 shrink-0">
          <button
            onClick={() => { setCollapsed((c) => !c); setMobileOpen((o) => !o); }}
            className="p-2 rounded-lg hover:bg-white/5 text-fg-muted hover:text-fg cursor-pointer focus-ring"
            aria-label="Toggle sidebar"
          >
            <Menu size={20} />
          </button>
          <div className="flex-1" />
          <ThemeToggle />
          <div className="hidden sm:flex items-center gap-2 text-xs text-fg-muted glass px-3 py-1.5 rounded-lg border border-border">
            <Activity size={12} className="text-accent animate-pulse-slow" />
            <span>Live</span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
