import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useLoanContacts } from '@/hooks/useLoanContacts';
import { useLoanEntryStore } from '@/stores/loanEntryStore';
import { useWalletStore } from '@/stores/walletStore';
import { useCategoryStore } from '@/stores/categoryStore';
import LoanForm from '@/components/loans/LoanForm';
import type { LoanEntryFormData } from '@/types';

export default function NewLoanPage() {
  const navigate = useNavigate();
  const { contactId } = useParams<{ contactId: string }>();
  const { loadContacts } = useLoanContacts();
  const { addEntry } = useLoanEntryStore();
  const { loadWallets } = useWalletStore();
  const { loadCategories } = useCategoryStore();

  useEffect(() => {
    loadContacts();
    loadWallets();
    loadCategories();
  }, [loadContacts, loadWallets, loadCategories]);

  const handleSubmit = async (data: LoanEntryFormData) => {
    await addEntry(data);
    navigate(`/loans/${data.contactId}`);
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-64px)]">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-5 pb-4">
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

      <LoanForm
        mode="create"
        defaultContactId={contactId}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
