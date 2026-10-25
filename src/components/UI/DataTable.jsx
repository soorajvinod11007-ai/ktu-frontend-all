import { useState } from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import { clsx } from 'clsx';
import { Pagination, EmptyState, Spinner } from './index';
import { Database } from 'lucide-react';

export function DataTable({ columns, data, total = 0, page = 1, pageSize = 25, loading, onPageChange, onSort, sortField, sortDir, rowKey = 'id', onRowClick }) {
  const handleSort = (field) => {
    if (!onSort) return;
    if (sortField === field) {
      onSort(sortDir === 'asc' ? `-${field}` : field);
    } else {
      onSort(field);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={clsx(
                    'px-4 py-3 text-left text-xs font-semibold text-fg-muted uppercase tracking-wider whitespace-nowrap',
                    col.sortable && 'cursor-pointer select-none hover:text-fg',
                    col.className
                  )}
                  onClick={col.sortable ? () => handleSort(col.key) : undefined}
                  aria-sort={sortField === col.key ? (sortDir === 'asc' ? 'ascending' : 'descending') : undefined}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.label}
                    {col.sortable && (
                      sortField === col.key
                        ? sortDir === 'asc'
                          ? <ChevronUp size={12} className="text-accent" />
                          : <ChevronDown size={12} className="text-accent" />
                        : <ChevronsUpDown size={12} className="opacity-40" />
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="py-16 text-center">
                  <Spinner size={28} className="mx-auto" />
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length}>
                  <EmptyState icon={Database} title="No records found" description="Try adjusting your search or filters." />
                </td>
              </tr>
            ) : (
              data.map((row) => (
                <tr
                  key={row[rowKey]}
                  className={clsx('border-b border-border/50 table-row-hover transition-colors', onRowClick && 'cursor-pointer')}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                >
                  {columns.map((col) => (
                    <td key={col.key} className={clsx('px-4 py-3 text-fg', col.className)}>
                      {col.render ? col.render(row[col.key], row) : (row[col.key] ?? '—')}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <Pagination page={page} pageSize={pageSize} total={total} onChange={onPageChange} />
    </div>
  );
}
