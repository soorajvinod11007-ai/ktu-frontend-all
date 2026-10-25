import { Link } from 'react-router-dom';
import { BarChart2, UserCheck, AlertCircle, Table2, GraduationCap, ArrowRight, Activity } from 'lucide-react';
import { REPORT_CONFIGS } from '../../utils/formatters';
import { clsx } from 'clsx';

const ICONS = { BarChart2, UserCheck, AlertCircle, Table2, GraduationCap };

export default function ReportHome() {
  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-accent/15">
          <Activity size={22} className="text-accent" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-fg">Reports</h1>
          <p className="text-sm text-fg-muted">View and export academic performance reports</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {REPORT_CONFIGS.map((r) => {
          const Icon = ICONS[r.icon] ?? BarChart2;
          return (
            <Link key={r.id} to={`/principal/report/${r.id}`}>
              <div className={clsx(
                'glass glass-hover rounded-2xl p-6 flex flex-col gap-4 cursor-pointer group',
                'border border-border hover:border-opacity-50 transition-all duration-200'
              )}
              style={{ borderColor: `${r.accent}30` }}>
                <div className={clsx('w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br', r.color)}>
                  <Icon size={22} style={{ color: r.accent }} />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-fg group-hover:text-accent transition-colors">{r.title}</h3>
                  <p className="text-sm text-fg-muted mt-1">{r.description}</p>
                </div>
                <div className="flex items-center gap-1 text-xs font-medium" style={{ color: r.accent }}>
                  View Report <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Note */}
      <div className="glass rounded-xl p-4 border border-border flex items-center gap-3 text-sm text-fg-muted">
        <Activity size={16} className="text-accent shrink-0" />
        All reports can be downloaded as PDF or Excel. Use the filter bar on each report page.
      </div>
    </div>
  );
}
