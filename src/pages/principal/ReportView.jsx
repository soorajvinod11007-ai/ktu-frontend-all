import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Download, Filter, RefreshCw, FileText, Table2, BarChart2, Users, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line } from 'recharts';
import { reportApi } from '../../services/api';
import { useToast } from '../../contexts/ToastContext';
import { Button, Card, Select, Badge, Spinner, EmptyState } from '../../components/UI/index';
import { REPORT_CONFIGS, fmtPct, fmtNum, downloadBlob } from '../../utils/formatters';
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

  if (reportId === 'course-faculty-performance') return <CourseFacultyReport data={data} />;
  if (reportId === 'program-semester') return <ProgramSemesterReport data={data} />;
  if (reportId === 'supplementary-status') return <SupplementaryReport data={data} />;
  if (reportId === 'faculty-history') return <FacultyHistoryReport data={data} />;
  if (reportId === 'graduation') return <GraduationReport data={data} />;
  return <pre className="text-xs text-fg-muted font-mono overflow-auto">{JSON.stringify(data, null, 2)}</pre>;
}

function CourseFacultyReport({ data }) {
  return (
    <div className="flex flex-col gap-4">
      {/* Header info */}
      <div className="flex flex-wrap gap-2 text-xs">
        {Object.entries(data.header ?? {}).map(([k, v]) => (
          <span key={k} className="glass px-3 py-1.5 rounded-lg border border-border">
            <span className="text-fg-muted capitalize">{k}: </span><span className="text-fg font-medium">{v}</span>
          </span>
        ))}
      </div>

      {/* Overall stats */}
      {data.overall && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Registered', value: data.overall.registered },
            { label: 'Appeared',   value: data.overall.appeared },
            { label: 'Cleared All', value: data.overall.cleared_all },
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
      {data.rows?.length > 0 && (
        <Card>
          <h3 className="text-sm font-semibold text-fg mb-3">Pass % by Course</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data.rows} margin={{ left: -20 }}>
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
            {data.rows?.map((row) => (
              <tr key={row.sl_no} className="border-b border-border/50 table-row-hover">
                <td className="px-3 py-2 text-fg-muted">{row.sl_no}</td>
                <td className="px-3 py-2 font-mono text-accent">{row.course_code}</td>
                <td className="px-3 py-2 text-fg max-w-[200px] truncate">{row.course_title}</td>
                <td className="px-3 py-2 text-fg-muted">{row.faculty}</td>
                <td className="px-3 py-2 font-mono">{row.registered}</td>
                <td className="px-3 py-2 font-mono">{row.appeared}</td>
                <td className="px-3 py-2 font-mono text-accent">{row.pass}</td>
                <td className="px-3 py-2 font-mono text-destructive">{row.fail}</td>
                <td className="px-3 py-2 font-mono font-semibold">{fmtPct(row.pass_pct_appeared)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Toppers */}
      {data.toppers?.length > 0 && (
        <Card>
          <h3 className="text-sm font-semibold text-fg mb-3">🏆 Toppers</h3>
          <div className="flex flex-wrap gap-2">
            {data.toppers.map((t) => (
              <div key={t.rank} className="glass px-4 py-2 rounded-xl border border-border flex items-center gap-2">
                <span className="text-accent font-bold text-sm">#{t.rank}</span>
                <div>
                  <p className="text-xs font-medium text-fg">{t.name}</p>
                  <p className="text-xs text-fg-muted">SGPA: {t.sgpa}</p>
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
            {data.rows?.map((row) => (
              <tr key={row.sl_no} className="border-b border-border/50 table-row-hover">
                <td className="px-3 py-2 text-fg-muted">{row.sl_no}</td>
                <td className="px-3 py-2 text-fg max-w-[180px] truncate">{row.program}</td>
                <td className="px-3 py-2 text-fg-muted">{row.batch}</td>
                <td className="px-3 py-2 font-mono">{row.semester}</td>
                <td className="px-3 py-2 font-mono">{row.registered}</td>
                <td className="px-3 py-2 font-mono text-accent">{row.passed}</td>
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
            {data.rows?.map((row) => (
              <tr key={row.sl_no} className="border-b border-border/50 table-row-hover">
                <td className="px-3 py-2 text-fg-muted">{row.sl_no}</td>
                <td className="px-3 py-2 font-mono text-xs">{row.register_no}</td>
                <td className="px-3 py-2 text-fg">{row.name}</td>
                {['S1','S2','S3','S4','S5','S6','S7','S8'].map((s) => (
                  <td key={s} className={clsx('px-3 py-2 font-mono text-center', (row.supply?.[s] ?? 0) > 0 ? 'text-destructive font-bold' : 'text-fg-muted')}>
                    {row.supply?.[s] ?? 0}
                  </td>
                ))}
                <td className="px-3 py-2 font-mono font-bold text-amber-500">{row.total_supply}</td>
                <td className="px-3 py-2 font-mono">{row.cgpa?.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function FacultyHistoryReport({ data }) {
  return (
    <div className="flex flex-col gap-4">
      {data.faculty && (
        <Card className="flex items-center gap-4 py-4">
          <Users size={32} className="text-accent" />
          <div>
            <p className="font-semibold text-fg">{data.faculty.name}</p>
            <p className="text-sm text-fg-muted">{data.faculty.department}</p>
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
            {data.rows?.map((row) => (
              <tr key={row.sl_no} className="border-b border-border/50 table-row-hover">
                <td className="px-3 py-2 text-fg-muted">{row.sl_no}</td>
                <td className="px-3 py-2 text-fg-muted">{row.batch}</td>
                <td className="px-3 py-2">{row.academic_year}</td>
                <td className="px-3 py-2 font-mono text-accent">{row.course_code}</td>
                <td className="px-3 py-2 max-w-[160px] truncate">{row.course_name}</td>
                <td className="px-3 py-2 font-mono">{row.registered}</td>
                <td className="px-3 py-2 font-mono">{row.appeared}</td>
                <td className="px-3 py-2 font-mono text-accent">{row.pass}</td>
                <td className="px-3 py-2 font-mono text-destructive">{row.fail}</td>
                <td className="px-3 py-2 font-mono font-semibold">{fmtPct(row.pass_pct_appeared)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function GraduationReport({ data }) {
  const chartData = data.rows?.map((r) => ({ name: r.batch?.split('-')[0] ?? r.sl_no, pct: r.graduation_pct })) ?? [];
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
            {data.rows?.map((row) => (
              <tr key={row.sl_no} className="border-b border-border/50 table-row-hover">
                <td className="px-3 py-2 text-fg-muted">{row.sl_no}</td>
                <td className="px-3 py-2 font-mono">{row.batch}</td>
                <td className="px-3 py-2 text-fg max-w-[180px] truncate">{row.program}</td>
                <td className="px-3 py-2 font-mono">{row.registered_s8}</td>
                <td className="px-3 py-2 font-mono text-accent">{row.graduated_zero_supply}</td>
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
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(null);

  useEffect(() => {
    setReportData(null);
    setFilters({});
    reportApi.filters().then(({ data }) => setFilterOptions(data)).catch(() => {});
  }, [reportId]);

  const setFilter = (key, val) => setFilters((f) => ({ ...f, [key]: val }));

  const canFetch = config?.required.every((k) => filters[k]);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await reportApi.get(reportId, filters);
      setReportData(data);
    } catch (err) {
      toast(err.response?.data?.error?.message ?? 'Failed to load report', 'error');
    } finally { setLoading(false); }
  }, [reportId, filters]);

  const handleDownload = async (format) => {
    setExporting(format);
    try {
      const { data } = await reportApi.download(reportId, format, filters);
      downloadBlob(data, `${reportId}.${format}`);
      toast(`${format.toUpperCase()} downloaded`, 'success');
    } catch { toast('Download failed', 'error'); }
    finally { setExporting(null); }
  };

  const renderFilter = (key) => {
    const optMap = {
      program_id:    { label: 'Program',       opts: filterOptions.programs ?? [] },
      batch_id:      { label: 'Batch',         opts: filterOptions.batches ?? [] },
      division_id:   { label: 'Division',      opts: filterOptions.divisions ?? [] },
      semester:      { label: 'Semester',      opts: filterOptions.semesters ?? [] },
      academic_year: { label: 'Academic Year', opts: filterOptions.academic_years ?? [] },
      faculty_id:    { label: 'Faculty',       opts: filterOptions.faculty ?? [] },
    };
    const { label, opts } = optMap[key] ?? { label: key, opts: [] };
    const isRequired = config.required.includes(key);
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
          {config?.required.length > 0 && <span className="text-xs text-fg-muted">* required</span>}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {allFilterKeys.map(renderFilter)}
        </div>
        <div className="flex justify-end mt-4">
          <Button onClick={fetchReport} loading={loading} disabled={!canFetch} icon={RefreshCw} size="sm">
            Generate Report
          </Button>
        </div>
        {!canFetch && (
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
      {!loading && reportData && <ReportData reportId={reportId} data={reportData} />}
    </div>
  );
}
