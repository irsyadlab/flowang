/**
 * ThemeCard - light / dark / system theme selector.
 */

import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import type { Theme } from '@/stores/uiStore';
import { cn } from '@/lib/utils';

const OPTIONS: { value: Theme; label: string; icon: React.ReactNode }[] = [
  { value: 'light', label: 'Terang', icon: <Sun className="h-4 w-4" /> },
  { value: 'dark', label: 'Gelap', icon: <Moon className="h-4 w-4" /> },
  { value: 'system', label: 'Sistem', icon: <Monitor className="h-4 w-4" /> },
];

export default function ThemeCard() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="grid grid-cols-3 gap-2">
      {OPTIONS.map((opt) => {
        const active = theme === opt.value;
        return (
          <button
            key={opt.value}
            onClick={() => setTheme(opt.value)}
            className={cn(
              'flex flex-col items-center gap-1.5 rounded-xl border px-3 py-3 text-xs font-medium transition-all',
              active
                ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                : 'border-border bg-background text-muted-foreground hover:border-primary/40 hover:bg-muted hover:text-foreground'
            )}
          >
            {opt.icon}
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
