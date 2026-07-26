import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useLoanContacts } from '@/hooks/useLoanContacts';
import { useLoanEntryStore } from '@/stores/loanEntryStore';
import LoanForm from '@/components/loans/LoanForm';
import type { LoanEntryFormData } from '@/types';
import { useStickyHeader } from '@/hooks/useStickyHeader';

export default function NewLoanPage() {
  const stickyHeader = useStickyHeader();
  const navigate = useNavigate();
  const { contactId } = useParams<{ contactId: string }>();
  useLoanContacts();
  const addEntry = useLoanEntryStore((s) => s.addEntry);

  const handleSubmit = async (data: LoanEntryFormData) => {
    await addEntry(data);
    navigate(`/loans/${data.contactId}`);
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
        <h1 className="text-xl font-bold text-foreground">Entri Hutang Baru</h1>
      </div>
      <div className="flex flex-col min-h-[calc(100vh-64px)]">

      <LoanForm
        mode="create"
        defaultContactId={contactId}
        onSubmit={handleSubmit}
      />
    </div>
    </div>
  );
}
