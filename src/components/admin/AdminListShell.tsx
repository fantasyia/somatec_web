'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { AdminTable, type Column } from './AdminTable';

type Props<T extends { id: string }> = {
  rows: T[];
  columns: Column<T>[];
  newHref: string;
  newLabel?: string;
  empty?: string;
};

export function AdminListShell<T extends { id: string }>({
  rows,
  columns,
  newHref,
  newLabel = 'Novo',
  empty,
}: Props<T>) {
  return (
    <div>
      <div className="flex justify-end px-6 py-4 border-b border-[rgb(var(--border))]">
        <Link
          href={newHref}
          className="admin-btn-primary"
        >
          <Plus className="h-4 w-4" strokeWidth={2} />
          {newLabel}
        </Link>
      </div>
      <AdminTable
        columns={columns}
        rows={rows}
        keyField="id"
        empty={empty}
      />
    </div>
  );
}
