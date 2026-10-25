import { useEffect, useState } from 'react';
import { History } from 'lucide-react';
import { uploadApi } from '../../services/api';
import { useToast } from '../../contexts/ToastContext';
import { Badge } from '../../components/UI/index';
import { DataTable } from '../../components/UI/DataTable';
import { fmtDateTime, statusBadge } from '../../utils/formatters';

export default function UploadHistory() {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const { data } = await uploadApi.history({ page, page_size: 25 });
        setItems(data.items ?? []);
        setTotal(data.total ?? 0);
      } catch { toast('Failed to load history', 'error'); }
      finally { setLoading(false); }
    })();
  }, [page]);

  const columns = [
    { key: 'id',          label: 'ID',         className: 'font-mono text-xs text-fg-muted w-12' },
    { key: 'file_name',   label: 'File',        sortable: true, className: 'font-mono text-xs' },
    { key: 'file_type',   label: 'Type',        render: (v) => <Badge className="badge-info">{v}</Badge> },
    { key: 'status',      label: 'Status',      render: (v) => <Badge className={statusBadge(v)}>{v}</Badge> },
    { key: 'rows_parsed', label: 'Parsed',      className: 'font-mono text-xs' },
    { key: 'rows_failed', label: 'Failed',      render: (v) => v > 0 ? <span className="text-destructive font-mono text-xs">{v}</span> : <span className="text-fg-muted font-mono text-xs">0</span> },
    { key: 'uploaded_at', label: 'Uploaded At', render: (v) => <span className="text-fg-muted text-xs">{fmtDateTime(v)}</span> },
  ];

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-accent/15">
          <History size={22} className="text-accent" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-fg">Upload History</h1>
          <p className="text-sm text-fg-muted">{total} uploads recorded</p>
        </div>
      </div>
      <DataTable columns={columns} data={items} total={total} page={page} pageSize={25} loading={loading} onPageChange={setPage} />
    </div>
  );
}
