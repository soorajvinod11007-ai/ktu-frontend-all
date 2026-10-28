import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Download, Filter, RefreshCw, FileText, Table2, BarChart2, Users, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line } from 'recharts';
import { reportApi } from '../../services/api';
import { useToast } from '../../contexts/ToastContext';
import { Button, Card, Select, Badge, Spinner, EmptyState, ErrorBoundary } from '../../components/UI/index';
import { REPORT_CONFIGS, fmtPct, fmtNum, downloadBlob, statusBadge } from '../../utils/formatters';
import { clsx } from 'clsx';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass rounded-lg px-3 py-2 border border-border text-xs">
      <p className="text-fg-muted mb-1">{label}</p>
      {payload.map((p) => <p key={p.dataKey} style={{ color: p.color }}>{p.name}: {p.value}</p>)}
    </div>
  );
};

// Render logic per report type
function ReportData({ reportId, data }) {
  if (!data) return null;

  const hasContent = Array.isArray(data)
    ? data.length > 0
    : (data.rows?.length > 0 || (data.items && data.items.length > 0) || Object.keys(data).length > 0);

  const rows = Array.isArray(data) ? data : (data.rows ?? data.items);
  if (rows && rows.length === 0 && !data.overall && !data.total && !data.faculty) {
    return (
      <EmptyState
        icon={BarChart2}
        title="No data found"
        description="No records match the selected filter criteria."
      />
    );
  }

  if (reportId === 'student-performance') return <StudentPerformanceReport data={data} />;
  if (reportId === 'course-faculty-performance') return <CourseFacultyReport data={data} />;
  if (reportId === 'program-semester') return <ProgramSemesterReport data={data} />;
  if (reportId === 'supplementary-status') return <SupplementaryReport data={data} />;
  if (reportId === 'faculty-history') return <FacultyHistoryReport data={data} />;
  if (reportId === 'graduation') return <GraduationReport data={data} />;
  return <pre className="text-xs text-fg-muted font-mono overflow-auto glass p-4 rounded-xl border border-border">{JSON.stringify(data, null, 2)}</pre>;
}

function StudentPerformanceReport({ data }) {
  return (
    <div className="flex flex-col gap-4">
      {data.summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total Students', value: data.summary.total_students ?? data.rows?.length ?? 0 },
            { label: 'Passed All', value: data.summary.passed_all ?? '—' },
            { label: 'Pass %', value: fmtPct(data.summary.pass_pct) },
            { label: 'Avg CGPA', value: data.summary.avg_cgpa ? Number(data.summary.avg_cgpa).toFixed(2) : '—' },
          ].map((s) => (
            <Card key={s.label} className="text-center py-4">
              <p className="text-xl font-bold font-mono text-accent">{s.value}</p>
              <p className="text-xs text-fg-muted mt-1">{s.label}</p>
            </Card>
          ))}
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border bg-muted/40">
              {['#', 'Reg No', 'Student Name', 'Program', 'Batch', 'Sem', 'SGPA', 'CGPA', 'Earned Credits', 'Status'].map((h) => (
                <th key={h} className="px-3 py-2.5 text-left text-fg-muted uppercase tracking-wider whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.rows?.map((row, idx) => (
              <tr key={row.register_no ?? row.id ?? idx} className="border-b border-border/50 table-row-hover">
                <td className="px-3 py-2 text-fg-muted">{row.sl_no ?? idx + 1}</td>
                <td className="px-3 py-2 font-mono text-accent">{row.register_no}</td>
                <td className="px-3 py-2 text-fg font-medium">{row.name ?? row.student_name}</td>
                <td className="px-3 py-2 text-fg-muted">{row.program_code ?? row.program ?? '—'}</td>
                <td className="px-3 py-2 font-mono text-fg-muted">{row.batch_label ?? row.batch ?? '—'}</td>
                <td className="px-3 py-2 font-mono">{row.semester ? `S${row.semester}` : '—'}</td>
                <td className="px-3 py-2 font-mono font-semibold">{row.sgpa != null ? Number(row.sgpa).toFixed(2) : '—'}</td>
                <td className="px-3 py-2 font-mono font-semibold text-accent">{row.cgpa != null ? Number(row.cgpa).toFixed(2) : '—'}</td>
                <td className="px-3 py-2 font-mono">{row.earned_credits ?? '—'}</td>
                <td className="px-3 py-2">
                  <Badge className={statusBadge(row.status ?? (row.total_supply > 0 ? 'failed' : 'passed'))}>
                    {row.status ?? (row.total_supply > 0 ? `${row.total_supply} Supply` : 'Passed')}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CourseFacultyReport({ data }) {
  const headerEntries = data.header && typeof data.header === 'object' ? Object.entries(data.header) : [];
  const rows = Array.isArray(data.rows) ? data.rows : [];
  const toppers = Array.isArray(data.toppers) ? data.toppers : [];

  return (
    <div className="flex flex-col gap-4">
      {/* Header info */}
      {headerEntries.length > 0 && (
        <div className="flex flex-wrap gap-2 text-xs">
          {headerEntries.map(([k, v]) => (
            <span key={k} className="glass px-3 py-1.5 rounded-lg border border-border">
              <span className="text-fg-muted capitalize">{String(k).replace(/_/g, ' ')}: </span>
              <span className="text-fg font-medium">{v != null ? String(v) : '—'}</span>
            </span>
          ))}
        </div>
      )}

      {/* Overall stats */}
      {data.overall && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Registered', value: data.overall.registered ?? '—' },
            { label: 'Appeared',   value: data.overall.appeared ?? '—' },
            { label: 'Cleared All', value: data.overall.cleared_all ?? '—' },
            { label: 'Class Pass %', value: fmtPct(data.overall.class_all_pass_pct) },
          ].map((s) => (
            <Card key={s.label} className="text-center py-4">
              <p className="text-xl font-bold font-mono text-accent">{s.value}</p>
              <p className="text-xs text-fg-muted mt-1">{s.label}</p>
            </Card>
          ))}
        </div>
      )}

      {/* Chart */}
      {rows.length > 0 && (
        <Card>
          <h3 className="text-sm font-semibold text-fg mb-3">Pass % by Course</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={rows} margin={{ left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(71,85,105,0.3)" />
              <XAxis dataKey="course_code" tick={{ fill: 'rgb(var(--color-fg-muted))', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'rgb(var(--color-fg-muted))', fontSize: 10 }} axisLine={false} tickLine={false} domain={[0, 100]} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="pass_pct_appeared" name="Pass %" fill="#22C55E" radius={[4,4,0,0]} fillOpacity={0.85} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border bg-muted/40">
              {['#', 'Code', 'Course', 'Faculty', 'Reg', 'App', 'Pass', 'Fail', 'Pass %'].map((h) => (
                <th key={h} className="px-3 py-2.5 text-left text-fg-muted uppercase tracking-wider whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={row.course_code ?? row.sl_no ?? idx} className="border-b border-border/50 table-row-hover">
                <td className="px-3 py-2 text-fg-muted">{row.sl_no ?? idx + 1}</td>
                <td className="px-3 py-2 font-mono text-accent">{row.course_code ?? '—'}</td>
                <td className="px-3 py-2 text-fg max-w-[200px] truncate">{row.course_title ?? row.course_name ?? '—'}</td>
                <td className="px-3 py-2 text-fg-muted">{row.faculty ?? '—'}</td>
                <td className="px-3 py-2 font-mono">{row.registered ?? 0}</td>
                <td className="px-3 py-2 font-mono">{row.appeared ?? 0}</td>
                <td className="px-3 py-2 font-mono text-accent">{row.pass ?? 0}</td>
                <td className="px-3 py-2 font-mono text-destructive">{row.fail ?? 0}</td>
                <td className="px-3 py-2 font-mono font-semibold">{fmtPct(row.pass_pct_appeared ?? row.pass_pct)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Toppers */}
      {toppers.length > 0 && (
        <Card>
          <h3 className="text-sm font-semibold text-fg mb-3">🏆 Toppers</h3>
          <div className="flex flex-wrap gap-2">
            {toppers.map((t, idx) => (
              <div key={t.rank ?? t.register_no ?? idx} className="glass px-4 py-2 rounded-xl border border-border flex items-center gap-2">
                <span className="text-accent font-bold text-sm">#{t.rank ?? idx + 1}</span>
                <div>
                  <p className="text-xs font-medium text-fg">{t.name ?? t.student_name ?? t.register_no}</p>
                  <p className="text-xs text-fg-muted">SGPA: {t.sgpa != null ? Number(t.sgpa).toFixed(2) : '—'}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

function ProgramSemesterReport({ data }) {
  const rows = Array.isArray(data.rows) ? data.rows : [];

  return (
    <div className="flex flex-col gap-4">
      {data.total && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Registered', value: fmtNum(data.total.registered) },
            { label: 'Passed',     value: fmtNum(data.total.passed) },
            { label: 'Avg Pass %', value: fmtPct(data.total.avg_pass_pct) },
          ].map((s) => (
            <Card key={s.label} className="text-center py-4">
              <p className="text-2xl font-bold font-mono text-accent">{s.value}</p>
              <p className="text-xs text-fg-muted mt-1">{s.label}</p>
            </Card>
          ))}
        </div>
      )}
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border bg-muted/40">
              {['#', 'Program', 'Batch', 'Sem', 'Registered', 'Passed', 'Pass %'].map((h) => (
                <th key={h} className="px-3 py-2.5 text-left text-fg-muted uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={row.sl_no ?? idx} className="border-b border-border/50 table-row-hover">
                <td className="px-3 py-2 text-fg-muted">{row.sl_no ?? idx + 1}</td>
                <td className="px-3 py-2 text-fg max-w-[180px] truncate">{row.program ?? '—'}</td>
                <td className="px-3 py-2 text-fg-muted">{row.batch ?? '—'}</td>
                <td className="px-3 py-2 font-mono">{row.semester != null ? `S${row.semester}` : '—'}</td>
                <td className="px-3 py-2 font-mono">{row.registered ?? 0}</td>
                <td className="px-3 py-2 font-mono text-accent">{row.passed ?? 0}</td>
                <td className="px-3 py-2 font-mono font-semibold">{fmtPct(row.pass_pct)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SupplementaryReport({ data }) {
  const rows = Array.isArray(data.rows) ? data.rows : [];

  return (
    <div className="flex flex-col gap-4">
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border bg-muted/40">
              {['#', 'Reg No', 'Name', 'S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8', 'Total', 'CGPA'].map((h) => (
                <th key={h} className="px-3 py-2.5 text-left text-fg-muted uppercase tracking-wider whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={row.register_no ?? row.sl_no ?? idx} className="border-b border-border/50 table-row-hover">
                <td className="px-3 py-2 text-fg-muted">{row.sl_no ?? idx + 1}</td>
                <td className="px-3 py-2 font-mono text-xs text-accent">{row.register_no ?? '—'}</td>
                <td className="px-3 py-2 text-fg font-medium">{row.name ?? row.student_name ?? '—'}</td>
                {['S1','S2','S3','S4','S5','S6','S7','S8'].map((s) => {
                  const count = Number(row.supply?.[s] ?? 0);
                  return (
                    <td key={s} className={clsx('px-3 py-2 font-mono text-center', count > 0 ? 'text-destructive font-bold' : 'text-fg-muted')}>
                      {count}
                    </td>
                  );
                })}
                <td className="px-3 py-2 font-mono font-bold text-amber-500">{row.total_supply ?? 0}</td>
                <td className="px-3 py-2 font-mono">
                  {row.cgpa != null && !isNaN(Number(row.cgpa)) ? Number(row.cgpa).toFixed(2) : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function FacultyHistoryReport({ data }) {
  const rows = Array.isArray(data.rows) ? data.rows : [];

  return (
    <div className="flex flex-col gap-4">
      {data.faculty && (
        <Card className="flex items-center gap-4 py-4">
          <Users size={32} className="text-accent" />
          <div>
            <p className="font-semibold text-fg">{data.faculty.name ?? 'Faculty'}</p>
            <p className="text-sm text-fg-muted">{data.faculty.department ?? '—'}</p>
          </div>
        </Card>
      )}
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border bg-muted/40">
              {['#', 'Batch', 'AY', 'Code', 'Course', 'Reg', 'App', 'Pass', 'Fail', 'Pass %'].map((h) => (
                <th key={h} className="px-3 py-2.5 text-left text-fg-muted uppercase tracking-wider whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={row.course_code ?? row.sl_no ?? idx} className="border-b border-border/50 table-row-hover">
                <td className="px-3 py-2 text-fg-muted">{row.sl_no ?? idx + 1}</td>
                <td className="px-3 py-2 text-fg-muted">{row.batch ?? '—'}</td>
                <td className="px-3 py-2">{row.academic_year ?? '—'}</td>
                <td className="px-3 py-2 font-mono text-accent">{row.course_code ?? '—'}</td>
                <td className="px-3 py-2 max-w-[160px] truncate">{row.course_name ?? row.course_title ?? '—'}</td>
                <td className="px-3 py-2 font-mono">{row.registered ?? 0}</td>
                <td className="px-3 py-2 font-mono">{row.appeared ?? 0}</td>
                <td className="px-3 py-2 font-mono text-accent">{row.pass ?? 0}</td>
                <td className="px-3 py-2 font-mono text-destructive">{row.fail ?? 0}</td>
                <td className="px-3 py-2 font-mono font-semibold">{fmtPct(row.pass_pct_appeared ?? row.pass_pct)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function GraduationReport({ data }) {
  const rows = Array.isArray(data.rows) ? data.rows : [];
  const chartData = rows.map((r, idx) => ({
    name: typeof r.batch === 'string' ? r.batch.split('-')[0] : (r.batch ?? r.sl_no ?? `B${idx + 1}`),
    pct: r.graduation_pct != null ? Number(r.graduation_pct) : 0,
  }));

  return (
    <div className="flex flex-col gap-4">
      {data.total && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Registered S8', value: fmtNum(data.total.registered_s8) },
            { label: 'Graduated (Zero Supply)', value: fmtNum(data.total.graduated_zero_supply) },
            { label: 'Graduation %', value: fmtPct(data.total.graduation_pct) },
          ].map((s) => (
            <Card key={s.label} className="text-center py-4">
              <p className="text-2xl font-bold font-mono text-accent">{s.value}</p>
              <p className="text-xs text-fg-muted mt-1">{s.label}</p>
            </Card>
          ))}
        </div>
      )}
      {chartData.length > 0 && (
        <Card>
          <h3 className="text-sm font-semibold text-fg mb-3">Graduation % by Batch</h3>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={chartData} margin={{ left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--color-border) / 0.7)" />
              <XAxis dataKey="name" tick={{ fill: 'rgb(var(--color-fg-muted))', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'rgb(var(--color-fg-muted))', fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, 100]} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="pct" name="Grad %" stroke="#22C55E" strokeWidth={2} dot={{ fill: '#22C55E', r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      )}
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border bg-muted/40">
              {['#', 'Batch', 'Program', 'Reg S8', 'Graduated', 'Grad %'].map((h) => (
                <th key={h} className="px-3 py-2.5 text-left text-fg-muted uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={row.batch ?? row.sl_no ?? idx} className="border-b border-border/50 table-row-hover">
                <td className="px-3 py-2 text-fg-muted">{row.sl_no ?? idx + 1}</td>
                <td className="px-3 py-2 font-mono">{row.batch ?? '—'}</td>
                <td className="px-3 py-2 text-fg max-w-[180px] truncate">{row.program ?? '—'}</td>
                <td className="px-3 py-2 font-mono">{row.registered_s8 ?? 0}</td>
                <td className="px-3 py-2 font-mono text-accent">{row.graduated_zero_supply ?? 0}</td>
                <td className="px-3 py-2 font-mono font-semibold">{fmtPct(row.graduation_pct)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Main ReportView ──────────────────────────────────────────────────────────
export default function ReportView() {
  const { reportId } = useParams();
  const toast = useToast();

  const config = REPORT_CONFIGS.find((r) => r.id === reportId);
  const [filters, setFilters] = useState({});
  const [filterOptions, setFilterOptions] = useState({});
  const [filtersLoading, setFiltersLoading] = useState(true);
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(null);

  useEffect(() => {
    setReportData(null);
    setFilters({});
    setFiltersLoading(true);
    reportApi.filters()
      .then(({ data }) => setFilterOptions(data))
      .catch(() => toast('Failed to load filter options. Please refresh.', 'error'))
      .finally(() => setFiltersLoading(false));
  }, [reportId]);

  const setFilter = (key, val) => setFilters((f) => {
    const next = { ...f, [key]: val || undefined };
    if (key === 'program_id' || key === 'batch_id') {
      delete next.division_id;
    }
    return next;
  });

  const canFetch = config?.required?.length === 0
    ? true
    : config?.required?.every((k) => filters[k]) ?? false;

  const fetchReport = useCallback(async () => {
    setLoading(true);
    try {
      const res = await reportApi.get(reportId, filters);
      // Support responses structured as { data: { ... } } or directly { ... }
      const payload = res?.data?.data !== undefined ? res.data.data : res.data;
      console.log('Report response:', res, 'Payload:', payload);
      setReportData(payload);
    } catch (err) {
      console.error('Failed to fetch report:', err);
      toast(err.response?.data?.error?.message ?? err.response?.data?.message ?? 'Failed to load report', 'error');
    } finally { setLoading(false); }
  }, [reportId, filters]);

  const handleDownload = async (format) => {
    setExporting(format);
    try {
      if (format === 'xlsx' && reportId !== 'student-performance') {
        const { generateResultAnalysisExcel } = await import('../../utils/resultAnalysisExcel');
        await generateResultAnalysisExcel(reportId, reportData, { filters, filterOptions });
        toast('Excel downloaded', 'success');
        return;
      }
      const { data } = await reportApi.download(reportId, format, filters);
      downloadBlob(data, `${reportId}.${format}`);
      toast(`${format.toUpperCase()} downloaded`, 'success');
    } catch (error) {
      console.error('Failed to download report:', error);
      toast(error.message ?? 'Download failed', 'error');
    }
    finally { setExporting(null); }
  };

  const renderFilter = (key) => {
    const optMap = {
      program_id:    { label: 'Program',       opts: filterOptions.programs ?? [] },
      batch_id:      { label: 'Batch',         opts: filterOptions.batches ?? [] },
      division_id:   {
        label: 'Division',
        opts: (filterOptions.divisions ?? []).filter((d) => {
          if (filters.program_id && d.program_id !== filters.program_id) return false;
          if (filters.batch_id && d.batch_id !== filters.batch_id) return false;
          return true;
        }),
      },
      semester:      { label: 'Semester',      opts: filterOptions.semesters ?? [] },
      academic_year: { label: 'Academic Year', opts: filterOptions.academic_years ?? [] },
      faculty_id:    { label: 'Faculty',       opts: filterOptions.faculty ?? [] },
    };
    const { label, opts } = optMap[key] ?? { label: key, opts: [] };
    const isRequired = config?.required?.includes(key);
    return (
      <Select key={key} label={`${label}${isRequired ? ' *' : ''}`} value={filters[key] ?? ''} onChange={(e) => setFilter(key, e.target.value || undefined)}>
        <option value="">All</option>
        {opts.map((o) => <option key={o.id ?? o} value={o.id ?? o}>{o.label ?? o}</option>)}
      </Select>
    );
  };

  const allFilterKeys = [...(config?.required ?? []), ...(config?.optional ?? [])];

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-fg">{config?.title ?? reportId}</h1>
          <p className="text-sm text-fg-muted">{config?.description}</p>
        </div>
        {reportData && (
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" loading={exporting === 'xlsx'} icon={FileText} onClick={() => handleDownload('xlsx')}>
              Excel
            </Button>
            <Button variant="secondary" size="sm" loading={exporting === 'pdf'} icon={FileText} onClick={() => handleDownload('pdf')}>
              PDF
            </Button>
          </div>
        )}
      </div>

      {/* Filters */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <Filter size={14} className="text-accent" />
          <span className="text-sm font-semibold text-fg">Filters</span>
          {config?.required?.length > 0 && <span className="text-xs text-fg-muted">* required</span>}
        </div>
        {filtersLoading ? (
          <div className="flex items-center gap-2 text-sm text-fg-muted py-4">
            <Spinner size={16} /> Loading filter options...
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {allFilterKeys.map(renderFilter)}
          </div>
        )}
        <div className="flex justify-end mt-4">
          <Button onClick={fetchReport} loading={loading} disabled={!canFetch} icon={RefreshCw} size="sm">
            Generate Report
          </Button>
        </div>
        {!canFetch && config?.required?.length > 0 && (
          <p className="text-xs text-fg-muted mt-2">
            Fill in required fields: {config?.required.join(', ')}
          </p>
        )}
      </Card>

      {/* Report Data */}
      {loading && <div className="flex items-center justify-center py-16"><Spinner size={40} /></div>}
      {!loading && !reportData && (
        <EmptyState icon={BarChart2} title="No report yet" description="Apply filters above and click Generate Report." />
      )}
      {!loading && reportData && (
        <ErrorBoundary title="Failed to render report">
          <ReportData reportId={reportId} data={reportData} />
        </ErrorBoundary>
      )}
    </div>
  );
}
