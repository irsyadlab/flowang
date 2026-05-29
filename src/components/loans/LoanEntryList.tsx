import type { LoanEntry } from '@/types';
import LoanEntryItem from './LoanEntryItem';
import EmptyState from '@/components/shared/EmptyState';
import { Receipt } from 'lucide-react';

interface LoanEntryListProps {
  entries: LoanEntry[];
  onToggleSettled: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function LoanEntryList({ entries, onToggleSettled, onDelete }: LoanEntryListProps) {
  if (entries.length === 0) {
    return (
      <EmptyState
        icon={Receipt}
        title="Belum ada catatan hutang"
        description="Tambahkan entri hutang pertama untuk mulai mencatat."
      />
    );
  }

  return (
    <div className="flex flex-col gap-2 stagger-children">
      {entries.map((entry) => (
        <LoanEntryItem
          key={entry.id}
          entry={entry}
          onToggleSettled={onToggleSettled}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
