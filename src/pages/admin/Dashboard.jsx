import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, UserCheck, BookOpen, FileText, Layers, AlertTriangle, Upload, RefreshCw } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { adminApi } from '../../services/api';
import { useToast } from '../../contexts/ToastContext';
import { Card, StatCard, Badge, Button, Spinner } from '../../components/UI/index';
import { fmtDateTime, statusBadge } from '../../utils/formatters';
import { clsx } from 'clsx';

const STATS = [
  { key: 'students',  label: 'Students',  icon: GraduationCap, color: '#22C55E' },
  { key: 'faculty',   label: 'Faculty',   icon: UserCheck,     color: '#3B82F6' },
  { key: 'subjects',  label: 'Subjects',  icon: BookOpen,      color: '#A855F7' },
  { key: 'results',   label: 'Results',   icon: FileText,      color: '#F59E0B' },
  { key: 'batches',   label: 'Batches',   icon: Layers,        color: '#EC4899' },
];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass rounded-lg px-3 py-2 border border-border text-xs">
      <p className="text-fg-muted mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} style={{ color: p.color }}>{p.name}: {p.value?.toLocaleString()}</p>
      ))}
    </div>
  );
};

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await adminApi.dashboard();
      setData(res.data);
    } catch {
      toast('Failed to load dashboard', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Spinner size={40} /></div>;
  }

  const chartData = STATS.map((s) => ({ name: s.label, value: data?.counts?.[s.key] ?? 0 }));

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-fg">Dashboard</h1>
          <p className="text-sm text-fg-muted mt-0.5">Academic data at a glance</p>
        </div>
        <Button variant="secondary" icon={RefreshCw} onClick={fetchData} loading={loading} size="sm">Refresh</Button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {STATS.map((s) => (
          <StatCard
            key={s.key}
            label={s.label}
            value={(data?.counts?.[s.key] ?? 0).toLocaleString()}
            icon={s.icon}
            color={s.color}
          />
        ))}
      </div>

      {/* Flagged Alert */}
      {data?.flagged_students > 0 && (
        <Link to="/admin/flagged">
          <div className="glass rounded-xl p-4 border border-amber-500/30 bg-amber-500/5 flex items-center gap-3 hover:bg-amber-500/10 transition-colors cursor-pointer">
            <AlertTriangle size={20} className="text-amber-500 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-fg">
                {data.flagged_students} student{data.flagged_students > 1 ? 's' : ''} flagged
              </p>
              <p className="text-xs text-fg-muted">Click to review flagged students</p>
            </div>
          </div>
        </Link>
      )}

      {/* Chart + Recent Uploads */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bar Chart */}
        <Card className="lg:col-span-2">
          <h2 className="text-sm font-semibold text-fg mb-4">Record Counts</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--color-border) / 0.7)" />
              <XAxis dataKey="name" tick={{ fill: 'rgb(var(--color-fg-muted))', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'rgb(var(--color-fg-muted))', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" name="Count" fill="#22C55E" radius={[4, 4, 0, 0]} fillOpacity={0.85} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Quick Actions */}
        <Card>
          <h2 className="text-sm font-semibold text-fg mb-4">Quick Actions</h2>
          <div className="flex flex-col gap-2">
            {[
              { to: '/admin/upload',    label: 'Upload Results',   icon: Upload,         color: '#22C55E' },
              { to: '/admin/students',  label: 'Manage Students',  icon: GraduationCap,  color: '#3B82F6' },
              { to: '/admin/faculty',   label: 'Manage Faculty',   icon: UserCheck,      color: '#A855F7' },
            ].map((a) => (
              <Link key={a.to} to={a.to}>
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl glass-hover border border-border hover:border-accent/40 transition-all cursor-pointer group">
                  <div className="p-2 rounded-lg" style={{ background: `${a.color}20` }}>
                    <a.icon size={16} style={{ color: a.color }} />
                  </div>
                  <span className="text-sm text-fg group-hover:text-accent transition-colors">{a.label}</span>
                </div>
              </Link>
            ))}
          </div>
        </Card>
      </div>

      {/* Recent Uploads */}
      <Card noPad>
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="text-sm font-semibold text-fg">Recent Uploads</h2>
          <Link to="/admin/upload-logs">
            <Button variant="ghost" size="sm">View all →</Button>
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                {['File', 'Type', 'Status', 'Rows', 'Uploaded At'].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-fg-muted uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(data?.recent_uploads ?? []).length === 0 ? (
                <tr><td colSpan={5} className="px-5 py-8 text-center text-fg-muted text-sm">No uploads yet</td></tr>
              ) : (
                (data?.recent_uploads ?? []).map((u) => (
                  <tr key={u.id} className="border-b border-border/50 table-row-hover">
                    <td className="px-5 py-3 font-mono text-xs text-fg">{u.file_name ?? u.filename ?? '-'}</td>
                    <td className="px-5 py-3"><Badge className="badge-info">{u.file_type}</Badge></td>
                    <td className="px-5 py-3"><Badge className={statusBadge(u.status)}>{u.status}</Badge></td>
                    <td className="px-5 py-3 font-mono text-xs">
                      <span className="text-accent">{u.rows_parsed ?? u.valid_rows ?? u.total_rows ?? 0}</span>
                      {(u.rows_failed ?? u.error_rows ?? 0) > 0 && (
                        <span className="text-destructive ml-1">/ {u.rows_failed ?? u.error_rows} err</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-fg-muted">{fmtDateTime(u.uploaded_at ?? u.created_at)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
