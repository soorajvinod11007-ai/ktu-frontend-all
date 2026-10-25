import { useState, useEffect } from 'react';
import { adminApi } from '../../services/api';
import { useToast } from '../../contexts/ToastContext';
import { Button, Input, Select } from '../../components/UI/index';
import { Loader2 } from 'lucide-react';

// Field definitions per resource
const FIELDS = {
  users: [
    { name: 'username',  label: 'Username',  type: 'text',     required: true },
    { name: 'email',     label: 'Email',     type: 'email',    required: true },
    { name: 'role',      label: 'Role',      type: 'select',   required: true, options: [{ value:'admin', label:'Admin' },{ value:'principal', label:'Principal' }] },
    { name: 'password',  label: 'Password',  type: 'password', required: false, hint: 'Leave blank to keep current' },
    { name: 'is_active', label: 'Active',    type: 'checkbox' },
  ],
  programs: [
    { name: 'code', label: 'Code', type: 'text', required: true },
    { name: 'name', label: 'Name', type: 'text', required: true },
    { name: 'is_active', label: 'Active', type: 'checkbox' },
  ],
  batches: [
    { name: 'start_year', label: 'Start Year', type: 'number', required: true },
    { name: 'end_year',   label: 'End Year',   type: 'number', required: true },
    { name: 'label',      label: 'Label',       type: 'text' },
  ],
  divisions: [
    { name: 'name',       label: 'Division Name', type: 'text',     required: true },
    { name: 'program_id', label: 'Program ID',    type: 'number',   required: true },
    { name: 'batch_id',   label: 'Batch ID',      type: 'number',   required: true },
  ],
  students: [
    { name: 'register_no',  label: 'Register No',   type: 'text',   required: true },
    { name: 'name',         label: 'Name',          type: 'text',   required: true },
    { name: 'program_id',   label: 'Program ID',    type: 'number', required: true },
    { name: 'batch_id',     label: 'Batch ID',      type: 'number', required: true },
    { name: 'division_id',  label: 'Division ID',   type: 'number' },
    { name: 'status',       label: 'Status',        type: 'select', options: [{ value:'active', label:'Active' },{ value:'inactive', label:'Inactive' },{ value:'graduated', label:'Graduated' }] },
  ],
  faculty: [
    { name: 'ktu_id',     label: 'KTU ID',      type: 'text',   required: true },
    { name: 'name',       label: 'Name',         type: 'text',   required: true },
    { name: 'email',      label: 'Email',        type: 'email' },
    { name: 'phone',      label: 'Phone',        type: 'text' },
    { name: 'program_id', label: 'Program ID',   type: 'number' },
    { name: 'is_active',  label: 'Active',       type: 'checkbox' },
  ],
  subjects: [
    { name: 'code',     label: 'Code',     type: 'text',   required: true },
    { name: 'name',     label: 'Name',     type: 'text',   required: true },
    { name: 'credits',  label: 'Credits',  type: 'number', required: true },
    { name: 'semester', label: 'Semester', type: 'number', required: true },
    { name: 'scheme',   label: 'Scheme',   type: 'text' },
    { name: 'type',     label: 'Type',     type: 'select', options: [{ value:'theory', label:'Theory' },{ value:'lab', label:'Lab' },{ value:'elective', label:'Elective' }] },
  ],
  'course-offerings': [
    { name: 'subject_id',    label: 'Subject ID',    type: 'number', required: true },
    { name: 'faculty_id',    label: 'Faculty ID',    type: 'number', required: true },
    { name: 'batch_id',      label: 'Batch ID',      type: 'number', required: true },
    { name: 'division_id',   label: 'Division ID',   type: 'number' },
    { name: 'semester',      label: 'Semester',      type: 'number', required: true },
    { name: 'academic_year', label: 'Academic Year', type: 'text',   required: true },
    { name: 'slot',          label: 'Slot',          type: 'text' },
  ],
  'exam-sessions': [
    { name: 'name',         label: 'Name',         type: 'text', required: true },
    { name: 'exam_type',    label: 'Exam Type',    type: 'select', options: [{ value:'regular', label:'Regular' },{ value:'supplementary', label:'Supplementary' },{ value:'revaluation', label:'Revaluation' }] },
    { name: 'scheme',       label: 'Scheme',       type: 'text' },
    { name: 'published_on', label: 'Published On', type: 'date' },
  ],
  results: [
    { name: 'student_id',      label: 'Student ID',      type: 'number', required: true },
    { name: 'subject_id',      label: 'Subject ID',      type: 'number', required: true },
    { name: 'exam_session_id', label: 'Session ID',      type: 'number', required: true },
    { name: 'semester',        label: 'Semester',        type: 'number', required: true },
    { name: 'grade',           label: 'Grade',           type: 'text' },
    { name: 'status',          label: 'Status',          type: 'select', options: [{ value:'pass', label:'Pass' },{ value:'fail', label:'Fail' },{ value:'absent', label:'Absent' },{ value:'withheld', label:'Withheld' }] },
  ],
};

export default function ResourceForm({ resource, initial, onSuccess, onCancel }) {
  const toast = useToast();
  const fields = FIELDS[resource] ?? [{ name: 'name', label: 'Name', type: 'text', required: true }];
  const init = () => {
    const o = {};
    fields.forEach((f) => { o[f.name] = initial?.[f.name] ?? (f.type === 'checkbox' ? true : ''); });
    return o;
  };
  const [form, setForm] = useState(init);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const set = (name, val) => setForm((f) => ({ ...f, [name]: val }));

  const validate = () => {
    const e = {};
    fields.forEach((f) => { if (f.required && !form[f.name] && form[f.name] !== 0) e[f.name] = 'Required'; });
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async () => {
    if (!validate()) return;
    setSaving(true);
    // Strip empty optional fields
    const payload = {};
    Object.entries(form).forEach(([k, v]) => { if (v !== '' && v !== null) payload[k] = v; });
    try {
      if (initial?.id) await adminApi.update(resource, initial.id, payload);
      else await adminApi.create(resource, payload);
      onSuccess();
    } catch (err) {
      const apiError = err.response?.data?.error;
      if (apiError?.details) {
        const e = {};
        apiError.details.forEach((d) => { e[d.field] = d.issue; });
        setErrors(e);
      }
      toast(apiError?.message ?? 'Save failed', 'error');
    } finally { setSaving(false); }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {fields.map((f) => {
          if (f.type === 'select') return (
            <Select key={f.name} label={f.label} value={form[f.name]} onChange={(e) => set(f.name, e.target.value)} error={errors[f.name]}>
              <option value="">Select…</option>
              {f.options?.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </Select>
          );
          if (f.type === 'checkbox') return (
            <div key={f.name} className="flex items-center gap-3 p-3 glass rounded-lg border border-border">
              <input type="checkbox" id={f.name} checked={!!form[f.name]} onChange={(e) => set(f.name, e.target.checked)} className="w-4 h-4 accent-accent cursor-pointer" />
              <label htmlFor={f.name} className="text-sm text-fg cursor-pointer">{f.label}</label>
            </div>
          );
          return (
            <Input key={f.name} label={f.label + (f.required ? ' *' : '')} type={f.type} value={form[f.name]} onChange={(e) => set(f.name, e.target.value)} error={errors[f.name]} />
          );
        })}
      </div>
      <div className="flex justify-end gap-3 pt-2 border-t border-border">
        <Button variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button onClick={submit} loading={saving}>{initial ? 'Save Changes' : 'Create'}</Button>
      </div>
    </div>
  );
}
