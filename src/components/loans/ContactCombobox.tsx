/**
 * ContactCombobox — autocomplete input untuk memilih atau membuat kontak.
 *
 * - Ketik nama → filter kontak yang ada
 * - Jika nama cocok persis (case-insensitive) → pakai id kontak lama
 * - Jika nama baru → tampilkan opsi "Buat kontak baru" → buat otomatis saat dipilih
 * - Disabled saat mode edit atau defaultContactId sudah ada
 */

import { useState, useRef, useEffect } from 'react';import { Check, UserPlus, ChevronDown, X } from 'lucide-react';
import { useLoanContactStore } from '@/stores/loanContactStore';
import { cn } from '@/lib/utils';

interface ContactComboboxProps {
  value: string;           // contactId yang terpilih
  onChange: (contactId: string) => void;
  disabled?: boolean;
  error?: string;
}

export default function ContactCombobox({ value, onChange, disabled, error }: ContactComboboxProps) {
  const { contacts, addContactAndGetId } = useLoanContactStore();

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [creating, setCreating] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Nama kontak yang sedang terpilih
  const selectedContact = contacts.find((c) => c.id === value);

  // Tutup dropdown saat klik di luar
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const trimmed = query.trim();

  // Filter kontak berdasarkan query
  const filtered = trimmed
    ? contacts.filter((c) => c.name.toLowerCase().includes(trimmed.toLowerCase()))
    : contacts;

  // Cek apakah nama sudah ada persis
  const exactMatch = contacts.find(
    (c) => c.name.toLowerCase() === trimmed.toLowerCase()
  );

  // Tampilkan opsi "buat baru" kalau ada query dan tidak ada exact match
  const showCreateOption = trimmed.length > 0 && !exactMatch;

  const handleSelect = (contactId: string) => {
    onChange(contactId);
    setOpen(false);
    setQuery('');
  };

  const handleCreate = async () => {
    if (!trimmed || creating) return;
    setCreating(true);
    try {
      const id = await addContactAndGetId({ name: trimmed });
      onChange(id);
      setOpen(false);
      setQuery('');
    } finally {
      setCreating(false);
    }
  };

  const handleClear = () => {
    onChange('');
    setQuery('');
    setOpen(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleInputFocus = () => {
    if (!disabled) setOpen(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    // Kalau user mengetik ulang, clear selection
    if (value) onChange('');
    setOpen(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered.length === 1) {
        handleSelect(filtered[0].id);
      } else if (showCreateOption) {
        handleCreate();
      }
    }
    if (e.key === 'Escape') {
      setOpen(false);
      setQuery('');
    }
  };

  return (
    <div ref={containerRef} className="relative flex-1">
      {/* Input trigger */}
      <div className={cn(
        'flex items-center gap-1',
        disabled && 'opacity-60 pointer-events-none'
      )}>
        {selectedContact && !open ? (
          // Tampilan saat kontak sudah dipilih
          <div className="flex flex-1 items-center justify-between">
            <span className="text-sm font-medium text-foreground">{selectedContact.name}</span>
            {!disabled && (
              <button
                type="button"
                onClick={handleClear}
                className="flex h-5 w-5 items-center justify-center rounded-md text-muted-foreground/50 hover:text-muted-foreground transition-colors"
                aria-label="Ganti kontak"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        ) : (
          // Input mode
          <div className="flex flex-1 items-center gap-1">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={handleInputChange}
              onFocus={handleInputFocus}
              onKeyDown={handleKeyDown}
              placeholder="Ketik nama..."
              disabled={disabled}
              className="flex-1 bg-transparent text-sm font-medium text-foreground outline-none placeholder:text-muted-foreground/40"
              autoComplete="off"
            />
            <ChevronDown className={cn(
              'h-3.5 w-3.5 shrink-0 text-muted-foreground/40 transition-transform',
              open && 'rotate-180'
            )} />
          </div>
        )}
      </div>

      {/* Error */}
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}

      {/* Dropdown */}
      {open && !disabled && (
        <div className="absolute left-0 top-full z-50 mt-1 w-full min-w-[200px] overflow-hidden rounded-xl border border-border bg-card shadow-lg">
          {/* Existing contacts */}
          {filtered.length > 0 && (
            <div className="max-h-48 overflow-y-auto py-1">
              {filtered.map((contact) => (
                <button
                  key={contact.id}
                  type="button"
                  onClick={() => handleSelect(contact.id)}
                  className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm transition-colors hover:bg-muted"
                >
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-primary/8 text-[10px] font-bold text-primary">
                    {contact.name.slice(0, 2).toUpperCase()}
                  </div>
                  <span className="flex-1 truncate font-medium text-foreground">{contact.name}</span>
                  {contact.id === value && (
                    <Check className="h-3.5 w-3.5 shrink-0 text-primary" />
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Create new option */}
          {showCreateOption && (
            <>
              {filtered.length > 0 && <div className="mx-3 border-t border-border" />}
              <button
                type="button"
                onClick={handleCreate}
                disabled={creating}
                className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm transition-colors hover:bg-muted disabled:opacity-60"
              >
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-primary/10">
                  <UserPlus className="h-3.5 w-3.5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="font-medium text-foreground">
                    {creating ? 'Membuat...' : 'Buat '}
                  </span>
                  {!creating && (
                    <span className="font-semibold text-primary">"{trimmed}"</span>
                  )}
                </div>
              </button>
            </>
          )}

          {/* Empty state */}
          {filtered.length === 0 && !showCreateOption && (
            <div className="px-3 py-4 text-center text-xs text-muted-foreground">
              Tidak ada kontak
            </div>
          )}
        </div>
      )}
    </div>
  );
}
