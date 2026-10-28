import { useEffect, useState } from 'react';
import { AlertTriangle, Search } from 'lucide-react';
import { adminApi } from '../../services/api';
import { useToast } from '../../contexts/ToastContext';
import { Card, Input, Badge, Spinner, EmptyState } from '../../components/UI/index';
import { DataTable } from '../../components/UI/DataTable';

export default function FlaggedStudents() {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const { data } = await adminApi.list('students', { page, page_size: 25, search: search || undefined, is_flagged: true });
        setItems(data.items ?? []);
        setTotal(data.total ?? 0);
      } catch { toast('Failed to load flagged students', 'error'); }
      finally { setLoading(false); }
    })();
  }, [page, search]);

  const columns = [
    { key: 'register_no', label: 'Reg No',  sortable: true, className: 'font-mono text-xs' },
    { key: 'name',        label: 'Name',    sortable: true },
    {
      key: 'program_code',
      label: 'Program',
      render: (v, row) => (v ? `${v}${row.program_name ? ' – ' + row.program_name : ''}` : (row.program_id ?? '—')),
    },
    { key: 'batch_label', label: 'Batch', render: (v, row) => v ?? row.batch_id ?? '—' },
    { key: 'division_name', label: 'Div', render: (v, row) => v ?? row.division_id ?? '—' },
    { key: 'status',      label: 'Status', render: (v) => <Badge className="badge-warning">{v}</Badge> },
  ];

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-amber-500/15">
          <AlertTriangle size={22} className="text-amber-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-fg">Flagged Students</h1>
          <p className="text-sm text-fg-muted">{total} students flagged for review</p>
        </div>
      </div>

      <div className="max-w-md">
        <Input icon={Search} placeholder="Search students…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
      </div>

      <DataTable columns={columns} data={items} total={total} page={page} pageSize={25} loading={loading} onPageChange={setPage} />
    </div>
  );
}
