import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useLoanEntries } from '@/hooks/useLoanEntries';
import LoanForm from '@/components/loans/LoanForm';
import ErrorMessage from '@/components/shared/ErrorMessage';
import type { LoanEntryFormData } from '@/types';
import { useStickyHeader } from '@/hooks/useStickyHeader';

export default function EditLoanPage() {
  const stickyHeader = useStickyHeader();
  const navigate = useNavigate();
  const { contactId, entryId } = useParams<{ contactId: string; entryId: string }>();
  const { entries, updateEntry } = useLoanEntries();

  const entry = entries.find((e) => e.id === entryId);

  if (!entry) {
    return <ErrorMessage message="Entri hutang tidak ditemukan" />;
  }

  const handleSubmit = async (data: LoanEntryFormData) => {
    await updateEntry(entryId!, {
      contactId: data.contactId,
      amount: data.amount,
      direction: data.direction,
      date: data.date,
      time: data.time,
      note: data.note,
      categoryId: data.categoryId,
    });
    navigate(`/loans/${contactId}`);
  };

  return (
    <div>
      {/* Header */}
      <div className={`${stickyHeader} px-4 flex items-center gap-3 pt-5 pb-4`}>
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex h-8 w-8 items-center justify-center rounded-xl bg-muted text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          aria-label="Kembali"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <h1 className="text-xl font-bold text-foreground">Edit Entri Hutang</h1>
      </div>
      <div className="flex flex-col min-h-[calc(100vh-64px)]">

      <LoanForm
        mode="edit"
        entry={entry}
        onSubmit={handleSubmit}
      />
    </div>
    </div>
  );
}
