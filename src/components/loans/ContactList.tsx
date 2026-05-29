import type { LoanContact, ContactSummary } from '@/types';
import ContactItem from './ContactItem';
import EmptyState from '@/components/shared/EmptyState';
import { Handshake } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface ContactListProps {
  contacts: LoanContact[];
  summaries: Map<string, ContactSummary>;
  onContactClick: (contactId: string) => void;
  onContactDelete: (contactId: string) => void;
}

export default function ContactList({ contacts, summaries, onContactClick, onContactDelete }: ContactListProps) {
  if (contacts.length === 0) {
    return (
      <EmptyState
        icon={Handshake}
        title="Belum ada catatan hutang"
        description="Mulai catat hutang atau piutang dengan menambahkan entri baru."
      />
    );
  }

  // Aggregate totals across all contacts
  let grandLend = 0;
  let grandBorrow = 0;
  for (const s of summaries.values()) {
    grandLend += s.totalLend;
    grandBorrow += s.totalBorrow;
  }
  const grandNet = grandLend - grandBorrow;
  const hasAny = grandLend > 0 || grandBorrow > 0;

  // Split into active vs settled
  const active = contacts.filter((c) => summaries.get(c.id)?.hasActiveEntries);
  const settled = contacts.filter((c) => !summaries.get(c.id)?.hasActiveEntries);

  return (
    <div className="space-y-4">
      {/* Global summary strip */}
      {hasAny && (
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-xl border border-border/60 bg-card px-3 py-2.5 text-center">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Piutang</p>
            <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums truncate">
              {formatCurrency(grandLend)}
            </p>
          </div>
          <div className="rounded-xl border border-border/60 bg-card px-3 py-2.5 text-center">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Hutang</p>
            <p className="text-xs font-semibold text-red-600 dark:text-red-400 tabular-nums truncate">
              {formatCurrency(grandBorrow)}
            </p>
          </div>
          <div className="rounded-xl border border-border/60 bg-card px-3 py-2.5 text-center">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Selisih</p>
            <p className={`text-xs font-semibold tabular-nums truncate ${grandNet >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
              {grandNet >= 0 ? '+' : ''}{formatCurrency(Math.abs(grandNet))}
            </p>
          </div>
        </div>
      )}

      {/* Active contacts */}
      {active.length > 0 && (
        <div className="space-y-2">
          {active.length < contacts.length && (
            <p className="px-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              Aktif
            </p>
          )}
          <div className="flex flex-col gap-2 stagger-children">
            {active.map((contact) => (
              <ContactItem
                key={contact.id}
                contact={contact}
                summary={summaries.get(contact.id) || { contactId: contact.id, totalLend: 0, totalBorrow: 0, hasActiveEntries: false }}
                onClick={() => onContactClick(contact.id)}
                onDelete={() => onContactDelete(contact.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Settled contacts */}
      {settled.length > 0 && (
        <div className="space-y-2">
          {active.length > 0 && (
            <p className="px-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              Lunas
            </p>
          )}
          <div className="flex flex-col gap-2">
            {settled.map((contact) => (
              <ContactItem
                key={contact.id}
                contact={contact}
                summary={summaries.get(contact.id) || { contactId: contact.id, totalLend: 0, totalBorrow: 0, hasActiveEntries: false }}
                onClick={() => onContactClick(contact.id)}
                onDelete={() => onContactDelete(contact.id)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
