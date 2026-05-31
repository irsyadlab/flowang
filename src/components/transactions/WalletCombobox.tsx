/**
 * WalletCombobox — autocomplete input untuk memilih wallet.
 *
 * - Ketik nama → filter wallet yang ada
 * - Tidak ada fitur buat wallet baru (wallet dibuat dari halaman Wallet)
 *
 * Dropdown dirender dengan posisi fixed agar tidak terpotong oleh overflow-hidden parent.
 */

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown, X } from 'lucide-react';
import { useWalletStore } from '@/stores/walletStore';
import { cn } from '@/lib/utils';

interface WalletComboboxProps {
  value: string;
  onChange: (walletId: string) => void;
  excludeId?: string;
  disabled?: boolean;
  placeholder?: string;
}

export default function WalletCombobox({
  value,
  onChange,
  excludeId,
  disabled,
  placeholder = 'Pilih wallet',
}: WalletComboboxProps) {
  const wallets = useWalletStore((s) => s.wallets);

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});

  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const anchorRef = useRef<HTMLDivElement>(null);

  const updateDropdownPosition = () => {
    if (!anchorRef.current) return;
    const rect = anchorRef.current.getBoundingClientRect();
    const isMobile = window.innerWidth < 768;
    if (isMobile) {
      setDropdownStyle({
        position: 'fixed',
        top: rect.bottom + 4,
        left: 16,
        right: 16,
        width: 'auto',
        zIndex: 9999,
      });
    } else {
      setDropdownStyle({
        position: 'fixed',
        top: rect.bottom + 4,
        left: rect.left,
        width: Math.max(rect.width, 220),
        zIndex: 9999,
      });
    }
  };

  // Tutup dropdown saat klik di luar
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      const isInsideContainer = containerRef.current?.contains(target);
      const dropdownEl = document.getElementById('wallet-combobox-dropdown');
      const isInsideDropdown = dropdownEl?.contains(target);
      if (!isInsideContainer && !isInsideDropdown) {
        setOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Update posisi saat scroll atau resize
  useEffect(() => {
    if (!open) return;
    const handleScroll = () => updateDropdownPosition();
    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleScroll);
    };
  }, [open]);

  const visibleWallets = excludeId
    ? wallets.filter((w) => w.id !== excludeId)
    : wallets;

  const trimmed = query.trim();

  const filtered = trimmed
    ? visibleWallets.filter((w) => w.name.toLowerCase().includes(trimmed.toLowerCase()))
    : visibleWallets;

  const selectedWallet = wallets.find((w) => w.id === value);

  const handleOpen = () => {
    updateDropdownPosition();
    setOpen(true);
  };

  const handleSelect = (walletId: string) => {
    onChange(walletId);
    setOpen(false);
    setQuery('');
  };

  const handleClear = () => {
    onChange('');
    setQuery('');
    handleOpen();
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleInputFocus = () => {
    if (!disabled) handleOpen();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    if (value) onChange('');
    if (!open) handleOpen();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered.length === 1) {
        handleSelect(filtered[0].id);
      }
    }
    if (e.key === 'Escape') {
      setOpen(false);
      setQuery('');
    }
  };

  const dropdown = open && !disabled && (
    <div
      id="wallet-combobox-dropdown"
      style={dropdownStyle}
      className="overflow-hidden rounded-xl border border-border bg-card shadow-lg"
    >
      {filtered.length > 0 ? (
        <div className="max-h-48 overflow-y-auto py-1">
          {filtered.map((wallet) => (
            <button
              key={wallet.id}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleSelect(wallet.id)}
              className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm transition-colors hover:bg-muted"
            >
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-primary/10 text-[10px] font-bold text-primary">
                {wallet.name.slice(0, 2).toUpperCase()}
              </div>
              <span className="flex-1 truncate font-medium text-foreground">{wallet.name}</span>
              {wallet.id === value && (
                <Check className="h-3.5 w-3.5 shrink-0 text-primary" />
              )}
            </button>
          ))}
        </div>
      ) : (
        <div className="px-3 py-4 text-center text-xs text-muted-foreground">
          Tidak ada wallet
        </div>
      )}
    </div>
  );

  return (
    <div ref={containerRef} className="relative flex-1">
      <div
        ref={anchorRef}
        className={cn('flex items-center gap-1', disabled && 'opacity-60 pointer-events-none')}
      >
        {selectedWallet && !open ? (
          <div className="flex flex-1 items-center justify-between">
            <span className="text-sm font-medium text-foreground">{selectedWallet.name}</span>
            {!disabled && (
              <button
                type="button"
                onClick={handleClear}
                className="flex h-5 w-5 items-center justify-center rounded-md text-muted-foreground/50 hover:text-muted-foreground transition-colors"
                aria-label="Ganti wallet"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-1 items-center gap-1">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={handleInputChange}
              onFocus={handleInputFocus}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={disabled}
              className="flex-1 bg-transparent text-sm font-medium text-foreground outline-none placeholder:text-muted-foreground/40"
              autoComplete="off"
            />
            <ChevronDown
              className={cn(
                'h-3.5 w-3.5 shrink-0 text-muted-foreground/40 transition-transform',
                open && 'rotate-180'
              )}
            />
          </div>
        )}
      </div>

      {typeof document !== 'undefined' && createPortal(dropdown, document.body)}
    </div>
  );
}
