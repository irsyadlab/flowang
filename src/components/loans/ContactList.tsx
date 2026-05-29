import type { LoanContact, ContactSummary } from '@/types';
import ContactItem from './ContactItem';
import EmptyState from '@/components/shared/EmptyState';
import { Users } from 'lucide-react';

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
        icon={Users}
        title="Belum ada kontak"
        description="Tambahkan kontak pertama untuk mulai mencatat hutang-piutang."
      />
    );
  }

  return (
    <div className="flex flex-col gap-2 stagger-children">
      {contacts.map((contact) => (
        <ContactItem
          key={contact.id}
          contact={contact}
          summary={summaries.get(contact.id) || { contactId: contact.id, totalLend: 0, totalBorrow: 0, hasActiveEntries: false }}
          onClick={() => onContactClick(contact.id)}
          onDelete={() => onContactDelete(contact.id)}
        />
      ))}
    </div>
  );
}
