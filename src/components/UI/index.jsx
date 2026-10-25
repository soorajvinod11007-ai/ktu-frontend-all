import { X, ChevronDown, Loader2 } from 'lucide-react';
import { clsx } from 'clsx';
import { useEffect, useRef } from 'react';

// ─── Button ──────────────────────────────────────────────────────────────────
export function Button({ children, variant = 'primary', size = 'md', loading, icon: Icon, className = '', ...props }) {
  const base = 'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all duration-200 cursor-pointer focus-ring disabled:opacity-50 disabled:cursor-not-allowed';
  const sizes = { sm: 'px-3 py-1.5 text-xs', md: 'px-4 py-2 text-sm', lg: 'px-6 py-2.5 text-base' };
  const variants = {
    primary:   'bg-accent text-background hover:bg-accent/90 shadow-glow',
    secondary: 'glass glass-hover text-fg border border-border',
    danger:    'bg-destructive/10 text-destructive border border-destructive/30 hover:bg-destructive/20',
    ghost:     'text-fg-muted hover:text-fg hover:bg-white/5',
    outline:   'border border-border text-fg hover:bg-white/5',
  };
  return (
    <button className={clsx(base, sizes[size], variants[variant], className)} disabled={loading} {...props}>
      {loading ? <Loader2 size={16} className="animate-spin" /> : Icon ? <Icon size={16} /> : null}
      {children}
    </button>
  );
}

// ─── Card ────────────────────────────────────────────────────────────────────
export function Card({ children, className = '', noPad = false }) {
  return (
    <div className={clsx('glass rounded-xl', noPad ? '' : 'p-6', className)}>
      {children}
    </div>
  );
}

// ─── Badge ───────────────────────────────────────────────────────────────────
export function Badge({ children, className = '' }) {
  return (
    <span className={clsx('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium', className)}>
      {children}
    </span>
  );
}

// ─── Input ───────────────────────────────────────────────────────────────────
export function Input({ label, error, icon: Icon, className = '', ...props }) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-xs font-medium text-fg-muted uppercase tracking-wider">{label}</label>}
      <div className="relative">
        {Icon && <Icon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-muted pointer-events-none" />}
        <input
          className={clsx(
            'w-full glass rounded-lg px-3 py-2 text-sm text-fg placeholder-fg-muted',
            'border border-border focus:border-accent focus:outline-none transition-colors',
            'focus-ring',
            Icon && 'pl-9',
            error && 'border-destructive',
            className
          )}
          {...props}
        />
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

// ─── Select ──────────────────────────────────────────────────────────────────
export function Select({ label, error, className = '', children, ...props }) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-xs font-medium text-fg-muted uppercase tracking-wider">{label}</label>}
      <div className="relative">
        <select
          className={clsx(
            'w-full glass rounded-lg px-3 py-2 text-sm text-fg appearance-none',
            'border border-border focus:border-accent focus:outline-none transition-colors',
            'focus-ring cursor-pointer',
            error && 'border-destructive',
            className
          )}
          {...props}
        >
          {children}
        </select>
        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-fg-muted pointer-events-none" />
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

// ─── Modal ───────────────────────────────────────────────────────────────────
export function Modal({ open, onClose, title, children, size = 'md' }) {
  const overlayRef = useRef(null);
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;
  const sizes = { sm: 'max-w-sm', md: 'max-w-xl', lg: 'max-w-3xl', xl: 'max-w-5xl', full: 'max-w-6xl' };

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
      role="dialog" aria-modal="true" aria-label={title}
    >
      <div className={clsx('glass rounded-2xl w-full flex flex-col max-h-[90vh] animate-slide-up', sizes[size])}>
        <div className="flex items-center justify-between p-5 border-b border-border shrink-0">
          <h2 className="text-base font-semibold text-fg">{title}</h2>
          <button onClick={onClose} className="text-fg-muted hover:text-fg cursor-pointer focus-ring rounded-lg p-1" aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  );
}

// ─── Confirm Dialog ──────────────────────────────────────────────────────────
export function ConfirmDialog({ open, onConfirm, onCancel, title = 'Are you sure?', message, danger }) {
  return (
    <Modal open={open} onClose={onCancel} title={title} size="sm">
      <p className="text-sm text-fg-muted mb-6">{message}</p>
      <div className="flex justify-end gap-3">
        <Button variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm}>Confirm</Button>
      </div>
    </Modal>
  );
}

// ─── Spinner ─────────────────────────────────────────────────────────────────
export function Spinner({ size = 24, className = '' }) {
  return <Loader2 size={size} className={clsx('animate-spin text-accent', className)} />;
}

// ─── Empty State ─────────────────────────────────────────────────────────────
export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
      {Icon && <div className="p-4 glass rounded-2xl text-fg-muted"><Icon size={32} /></div>}
      <div>
        <p className="text-fg font-medium">{title}</p>
        {description && <p className="text-sm text-fg-muted mt-1">{description}</p>}
      </div>
      {action}
    </div>
  );
}

// ─── Pagination ──────────────────────────────────────────────────────────────
export function Pagination({ page, pageSize, total, onChange }) {
  const totalPages = Math.ceil(total / pageSize);
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between text-sm text-fg-muted">
      <span>
        Showing {Math.min((page - 1) * pageSize + 1, total)}–{Math.min(page * pageSize, total)} of {total.toLocaleString()}
      </span>
      <div className="flex gap-1">
        <Button variant="ghost" size="sm" onClick={() => onChange(page - 1)} disabled={page <= 1}>←</Button>
        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
          let p;
          if (totalPages <= 5) p = i + 1;
          else if (page <= 3) p = i + 1;
          else if (page >= totalPages - 2) p = totalPages - 4 + i;
          else p = page - 2 + i;
          return (
            <Button key={p} variant={p === page ? 'primary' : 'ghost'} size="sm" onClick={() => onChange(p)}>
              {p}
            </Button>
          );
        })}
        <Button variant="ghost" size="sm" onClick={() => onChange(page + 1)} disabled={page >= totalPages}>→</Button>
      </div>
    </div>
  );
}

// ─── Stat Card ───────────────────────────────────────────────────────────────
export function StatCard({ label, value, icon: Icon, color = '#22C55E', sub }) {
  return (
    <Card className="flex items-center gap-4">
      <div className="p-3 rounded-xl" style={{ background: `${color}20` }}>
        {Icon && <Icon size={22} style={{ color }} />}
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-bold text-fg font-mono">{value}</p>
        <p className="text-xs text-fg-muted truncate">{label}</p>
        {sub && <p className="text-xs mt-0.5" style={{ color }}>{sub}</p>}
      </div>
    </Card>
  );
}
