/**
 * CategoryCombobox — autocomplete input untuk memilih atau membuat kategori.
 *
 * - Ketik nama → filter kategori yang ada (sesuai type filter)
 * - Jika nama cocok persis (case-insensitive) → pakai id kategori lama
 * - Jika nama baru → tampilkan opsi "Buat kategori baru" → buat otomatis saat dipilih
 *
 * Dropdown dirender dengan posisi fixed agar tidak terpotong oleh overflow-hidden parent.
 */

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Check, FolderPlus, ChevronDown, X } from 'lucide-react';
import { useCategoryStore } from '@/stores/categoryStore';
import type { CategoryType } from '@/types';
import { cn } from '@/lib/utils';

interface CategoryComboboxProps {
  value: string;
  onChange: (categoryId: string) => void;
  typeFilter?: 'income' | 'expense';
  disabled?: boolean;
  placeholder?: string;
}

export default function CategoryCombobox({
  value,
  onChange,
  typeFilter,
  disabled,
  placeholder = 'Pilih kategori',
}: CategoryComboboxProps) {
  const { categories, addCategory } = useCategoryStore();

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [creating, setCreating] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});

  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const anchorRef = useRef<HTMLDivElement>(null);

  // Hitung posisi dropdown berdasarkan anchor element
  const updateDropdownPosition = () => {
    if (!anchorRef.current) return;
    const rect = anchorRef.current.getBoundingClientRect();
    setDropdownStyle({
      position: 'fixed',
      top: rect.bottom + 4,
      left: rect.left,
      width: Math.max(rect.width, 220),
      zIndex: 9999,
    });
  };

  // Tutup dropdown saat klik di luar
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      const isInsideContainer = containerRef.current?.contains(target);
      // Cek apakah klik di dalam dropdown portal
      const dropdownEl = document.getElementById('category-combobox-dropdown');
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

  const visibleCategories = typeFilter
    ? categories.filter((c) => c.type === 'both' || c.type === typeFilter)
    : categories;

  const trimmed = query.trim();

  const filtered = trimmed
    ? visibleCategories.filter((c) => c.name.toLowerCase().includes(trimmed.toLowerCase()))
    : visibleCategories;

  const exactMatch = visibleCategories.find(
    (c) => c.name.toLowerCase() === trimmed.toLowerCase()
  );

  const showCreateOption = trimmed.length > 0 && !exactMatch;
  const selectedCategory = categories.find((c) => c.id === value);

  const handleOpen = () => {
    updateDropdownPosition();
    setOpen(true);
  };

  const handleSelect = (categoryId: string) => {
    onChange(categoryId);
    setOpen(false);
    setQuery('');
  };

  const handleCreate = async () => {
    if (!trimmed || creating) return;
    setCreating(true);
    try {
      const newType: CategoryType = typeFilter ?? 'both';
      await addCategory({ name: trimmed, type: newType, isDefault: false });

      await new Promise((r) => setTimeout(r, 50));
      const fresh = useCategoryStore.getState().categories;
      const created = fresh.find(
        (c) => c.name.toLowerCase() === trimmed.toLowerCase() && (c.type === newType || c.type === 'both')
      );
      if (created) onChange(created.id);
      setOpen(false);
      setQuery('');
    } finally {
      setCreating(false);
    }
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
      } else if (showCreateOption) {
        handleCreate();
      }
    }
    if (e.key === 'Escape') {
      setOpen(false);
      setQuery('');
    }
  };

  const dropdown = open && !disabled && (
    <div
      id="category-combobox-dropdown"
      style={dropdownStyle}
      className="overflow-hidden rounded-xl border border-border bg-card shadow-lg"
    >
      {filtered.length > 0 && (
        <div className="max-h-48 overflow-y-auto py-1">
          {filtered.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleSelect(cat.id)}
              className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm transition-colors hover:bg-muted"
            >
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-primary/10 text-[10px] font-bold text-primary">
                {cat.name.slice(0, 2).toUpperCase()}
              </div>
              <span className="flex-1 truncate font-medium text-foreground">{cat.name}</span>
              {cat.id === value && (
                <Check className="h-3.5 w-3.5 shrink-0 text-primary" />
              )}
            </button>
          ))}
        </div>
      )}

      {showCreateOption && (
        <>
          {filtered.length > 0 && <div className="mx-3 border-t border-border" />}
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={handleCreate}
            disabled={creating}
            className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm transition-colors hover:bg-muted disabled:opacity-60"
          >
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-primary/10">
              <FolderPlus className="h-3.5 w-3.5 text-primary" />
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

      {filtered.length === 0 && !showCreateOption && (
        <div className="px-3 py-4 text-center text-xs text-muted-foreground">
          Tidak ada kategori
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
        {selectedCategory && !open ? (
          <div className="flex flex-1 items-center justify-between">
            <span className="text-sm font-medium text-foreground">{selectedCategory.name}</span>
            {!disabled && (
              <button
                type="button"
                onClick={handleClear}
                className="flex h-5 w-5 items-center justify-center rounded-md text-muted-foreground/50 hover:text-muted-foreground transition-colors"
                aria-label="Ganti kategori"
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
