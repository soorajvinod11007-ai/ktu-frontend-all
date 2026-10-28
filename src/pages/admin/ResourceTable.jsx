import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Search, Plus, Download, RefreshCw, Trash2, Pencil, RotateCcw, X } from 'lucide-react';
import { clsx } from 'clsx';
import { adminApi } from '../../services/api';
import { useToast } from '../../contexts/ToastContext';
import { Button, Input, Badge, Modal, ConfirmDialog, EmptyState } from '../../components/UI/index';
import { DataTable } from '../../components/UI/DataTable';
import { RESOURCE_LABELS, statusBadge, fmtDate, fmtPct, downloadBlob } from '../../utils/formatters';
import { Database } from 'lucide-react';
import ResourceForm from './ResourceForm';

const READ_ONLY = ['result-history', 'upload-logs'];

function buildColumns(resource) {
  const common = { id: { key: 'id', label: 'ID', sortable: true, className: 'w-16 font-mono text-xs text-fg-muted' } };
  const statusCol = { key: 'is_active', label: 'Active', render: (v) => <Badge className={v ? 'badge-success' : 'badge-default'}>{v ? 'Yes' : 'No'}</Badge> };

  const defs = {
    users:     [common.id, { key:'username', label:'Username', sortable:true }, { key:'email', label:'Email', sortable:true }, { key:'role', label:'Role', render:(v)=><Badge className={v==='admin'?'badge-danger':'badge-info'}>{v}</Badge> }, statusCol],
    programs:  [common.id, { key:'code', label:'Code', sortable:true }, { key:'name', label:'Name', sortable:true }, statusCol],
    batches:   [common.id, { key:'label', label:'Label', sortable:true }, { key:'start_year', label:'Start' }, { key:'end_year', label:'End' }],
    divisions: [common.id, { key:'name', label:'Division', sortable:true }, { key:'program_code', label:'Program', render:(v,row)=>v??row.program_id??'—' }, { key:'batch_label', label:'Batch', render:(v,row)=>v??row.batch_id??'—' }],
    students:  [common.id, { key:'register_no', label:'Reg No', sortable:true }, { key:'name', label:'Name', sortable:true }, { key:'program_code', label:'Program', render:(v,row)=>v ? `${v}${row.program_name ? ' – '+row.program_name : ''}` : (row.program_id ?? '—') }, { key:'batch_label', label:'Batch', render:(v,row)=>v ?? row.batch_id ?? '—' }, { key:'division_name', label:'Div', render:(v,row)=>v ?? row.division_id ?? '—' }, { key:'status', label:'Status', render:(v)=><Badge className={statusBadge(v)}>{v}</Badge> }, { key:'is_flagged', label:'Flagged', render:(v)=>v?<Badge className="badge-warning">Yes</Badge>:null }],
    faculty:   [common.id, { key:'ktu_id', label:'KTU ID', sortable:true }, { key:'name', label:'Name', sortable:true }, { key:'email', label:'Email' }, { key:'program_code', label:'Program', render:(v)=>v??'—' }, statusCol],
    subjects:  [common.id, { key:'code', label:'Code', sortable:true }, { key:'name', label:'Name', sortable:true }, { key:'credits', label:'Credits' }, { key:'semester', label:'Sem' }, { key:'scheme', label:'Scheme' }, { key:'type', label:'Type' }],
    'course-offerings': [common.id, { key:'subject_code', label:'Subject', render:(v,row)=>v ? `${v}${row.subject_name ? ' – '+row.subject_name : ''}` : (row.subject_id ?? '—') }, { key:'faculty_name', label:'Faculty', render:(v,row)=>v ?? row.faculty_id ?? '—' }, { key:'batch_label', label:'Batch', render:(v,row)=>v ?? row.batch_id ?? '—' }, { key:'semester', label:'Sem' }, { key:'academic_year', label:'AY', sortable:true }, { key:'slot', label:'Slot' }],
    'exam-sessions': [common.id, { key:'name', label:'Name', sortable:true }, { key:'exam_type', label:'Type' }, { key:'scheme', label:'Scheme' }, { key:'published_on', label:'Published', render:(v)=>fmtDate(v) }],
    results:   [common.id, { key:'register_no', label:'Reg No' }, { key:'student_name', label:'Student' }, { key:'subject_code', label:'Subject', render:(v,row)=>v ? `${v}${row.subject_name ? ' – '+row.subject_name : ''}` : (row.subject_id ?? '—') }, { key:'semester', label:'Sem' }, { key:'grade', label:'Grade' }, { key:'status', label:'Status', render:(v)=><Badge className={statusBadge(v)}>{v}</Badge> }],
    'grade-cards': [common.id, { key:'student_name', label:'Student', render:(v,row)=>v ? `${v}${row.register_no ? ' ('+row.register_no+')' : ''}` : (row.register_no ?? row.student_id ?? '—') }, { key:'semester', label:'Sem' }, { key:'exam_type', label:'Session Type', render:(v,row)=>v ?? row.exam_session_id ?? '—' }, { key:'sgpa', label:'SGPA', sortable:true, render:(v)=>v?.toFixed(2) }, { key:'cgpa', label:'CGPA', sortable:true, render:(v)=>v?.toFixed(2) }, { key:'earned_credits', label:'Credits' }],
    'result-history': [common.id, { key:'semester_result_id', label:'Result ID' }, { key:'change_type', label:'Change' }, { key:'old_grade', label:'Old' }, { key:'new_grade', label:'New' }],
    'upload-logs': [common.id, { key:'file_name', label:'File', className:'font-mono text-xs' }, { key:'file_type', label:'Type' }, { key:'status', label:'Status', render:(v)=><Badge className={statusBadge(v)}>{v}</Badge> }, { key:'rows_parsed', label:'Parsed' }, { key:'rows_failed', label:'Failed', render:(v)=>v>0?<span className="text-destructive">{v}</span>:v }, { key:'uploaded_at', label:'Uploaded', render:(v)=>fmtDate(v) }],
  };
  return defs[resource] ?? [common.id, { key:'name', label:'Name', sortable:true }];
}

export default function ResourceTable() {
  const { resource } = useParams();
  const toast = useToast();

  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('id');
  const [loading, setLoading] = useState(true);

  const [formOpen, setFormOpen] = useState(false);
  const [editRow, setEditRow] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [restoreTarget, setRestoreTarget] = useState(null);

  const isReadOnly = READ_ONLY.includes(resource);
  const label = RESOURCE_LABELS[resource] ?? resource;
  const columns = buildColumns(resource);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await adminApi.list(resource, { page, page_size: 25, search: search || undefined, sort });
      setItems(data.items ?? []);
      setTotal(data.total ?? 0);
    } catch {
      toast(`Failed to load ${label}`, 'error');
    } finally { setLoading(false); }
  }, [resource, page, search, sort]);

  useEffect(() => {
    setPage(1);
    setSearch('');
    setSort('id');
  }, [resource]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleDelete = async () => {
    try {
      await adminApi.remove(resource, deleteTarget.id);
      toast(`${label.slice(0,-1)} deleted`, 'success');
      loadData();
    } catch (err) {
      toast(err.response?.data?.error?.message ?? 'Delete failed', 'error');
    } finally { setDeleteTarget(null); }
  };

  const handleRestore = async () => {
    try {
      await adminApi.restore(resource, restoreTarget.id);
      toast('Restored successfully', 'success');
      loadData();
    } catch { toast('Restore failed', 'error'); }
    finally { setRestoreTarget(null); }
  };

  const handleExport = async () => {
    try {
      const { data } = await adminApi.export(resource, { search: search || undefined });
      downloadBlob(data, `${resource}-export.xlsx`);
      toast('Export downloaded', 'success');
    } catch { toast('Export failed', 'error'); }
  };

  // Append action column
  const allColumns = isReadOnly ? columns : [
    ...columns,
    {
      key: '_actions',
      label: '',
      className: 'w-24',
      render: (_, row) => (
        <div className="flex items-center gap-1 justify-end">
          <button onClick={(e) => { e.stopPropagation(); setEditRow(row); setFormOpen(true); }}
            className="p-1.5 rounded-lg text-fg-muted hover:text-accent hover:bg-accent/10 transition-colors cursor-pointer" title="Edit">
            <Pencil size={14} />
          </button>
          {row.deleted_at ? (
            <button onClick={(e) => { e.stopPropagation(); setRestoreTarget(row); }}
              className="p-1.5 rounded-lg text-fg-muted hover:text-accent-amber hover:bg-amber-500/10 transition-colors cursor-pointer" title="Restore">
              <RotateCcw size={14} />
            </button>
          ) : (
            <button onClick={(e) => { e.stopPropagation(); setDeleteTarget(row); }}
              className="p-1.5 rounded-lg text-fg-muted hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer" title="Delete">
              <Trash2 size={14} />
            </button>
          )}
        </div>
      ),
    },
  ];

  const [sortField, sortDir] = sort.startsWith('-') ? [sort.slice(1), 'desc'] : [sort, 'asc'];

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-fg">{label}</h1>
          <p className="text-sm text-fg-muted">{total.toLocaleString()} records</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" icon={Download} size="sm" onClick={handleExport}>Export</Button>
          <Button variant="secondary" icon={RefreshCw} size="sm" onClick={loadData}>Refresh</Button>
          {!isReadOnly && (
            <Button icon={Plus} size="sm" onClick={() => { setEditRow(null); setFormOpen(true); }}>
              Add {label.replace(/s$/, '')}
            </Button>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="flex gap-3">
        <div className="flex-1 max-w-md">
          <Input
            icon={Search}
            placeholder={`Search ${label.toLowerCase()}…`}
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        {search && (
          <Button variant="ghost" icon={X} size="sm" onClick={() => { setSearch(''); setPage(1); }}>Clear</Button>
        )}
      </div>

      {/* Table */}
      <DataTable
        columns={allColumns}
        data={items}
        total={total}
        page={page}
        pageSize={25}
        loading={loading}
        onPageChange={setPage}
        onSort={(s) => { setSort(s); setPage(1); }}
        sortField={sortField}
        sortDir={sortDir}
      />

      {/* Form Modal */}
      <Modal open={formOpen} onClose={() => setFormOpen(false)} title={editRow ? `Edit ${label.replace(/s$/, '')}` : `Add ${label.replace(/s$/, '')}`} size="md">
        <ResourceForm resource={resource} initial={editRow} onSuccess={() => { setFormOpen(false); loadData(); toast('Saved successfully', 'success'); }} onCancel={() => setFormOpen(false)} />
      </Modal>

      {/* Delete confirm */}
      <ConfirmDialog
        open={!!deleteTarget}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete record?"
        message={`This will soft-delete the record. It can be restored later.`}
        danger
      />

      {/* Restore confirm */}
      <ConfirmDialog
        open={!!restoreTarget}
        onCancel={() => setRestoreTarget(null)}
        onConfirm={handleRestore}
        title="Restore record?"
        message="This will make the record active again."
      />
    </div>
  );
}
