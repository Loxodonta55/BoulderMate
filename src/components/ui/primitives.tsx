import React from 'react';
import { ChevronRight } from 'lucide-react';

/** SPEC-020 · Basis-Primitives (SegmentedControl, Chip, ListGroup, ListRow). */

export interface SegmentedControlProps<T extends string> {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
  testId?: string;
  className?: string;
}

export function SegmentedControl<T extends string>({ value, options, onChange, testId, className = '' }: SegmentedControlProps<T>) {
  return (
    <div
      role="tablist"
      data-testid={testId}
      className={`flex p-0.5 rounded-[10px] bg-[var(--bm-elevated)] ${className}`}
    >
      {options.map(o => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(o.value)}
            className={`flex-1 min-h-[32px] px-3 rounded-[8px] text-[13px] font-semibold transition ${
              active ? 'bg-[var(--bm-surface)] text-[var(--bm-text)] shadow-sm' : 'text-[var(--bm-text-2)]'
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export interface ChipProps {
  active?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
  testId?: string;
}

export const Chip: React.FC<ChipProps> = ({ active, onClick, children, testId }) => (
  <button
    type="button"
    onClick={onClick}
    data-testid={testId}
    aria-pressed={active}
    className={`shrink-0 min-h-[34px] px-3.5 rounded-full text-[14px] font-medium transition flex items-center gap-1.5 ${
      active
        ? 'bg-[var(--bm-strong)] text-[var(--bm-bg)]'
        : 'bg-[var(--bm-elevated)] text-[var(--bm-text)]'
    }`}
  >
    {children}
  </button>
);

export const ListGroup: React.FC<{ title?: string; children: React.ReactNode; footer?: string }> = ({ title, children, footer }) => (
  <section className="space-y-1.5">
    {title && <h3 className="px-4 text-[13px] font-medium text-[var(--bm-text-2)]">{title}</h3>}
    <div className="rounded-2xl bg-[var(--bm-surface)] overflow-hidden divide-y divide-[var(--bm-line)]">{children}</div>
    {footer && <p className="px-4 text-[12px] text-[var(--bm-text-2)]">{footer}</p>}
  </section>
);

export interface ListRowProps {
  icon?: React.ReactNode;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  value?: React.ReactNode;
  onClick?: () => void;
  chevron?: boolean;
  destructive?: boolean;
  testId?: string;
}

export const ListRow: React.FC<ListRowProps> = ({ icon, title, subtitle, value, onClick, chevron = Boolean(onClick), destructive, testId }) => {
  const Comp: any = onClick ? 'button' : 'div';
  return (
    <Comp
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      data-testid={testId}
      className={`w-full text-left flex items-center gap-3 px-4 min-h-[52px] py-2.5 ${onClick ? 'active:bg-[var(--bm-elevated)]' : ''}`}
    >
      {icon && <span className="shrink-0 flex items-center justify-center">{icon}</span>}
      <span className="flex-1 min-w-0">
        <span className={`block text-[16px] truncate ${destructive ? 'text-[var(--bm-danger)]' : 'text-[var(--bm-text)]'}`}>{title}</span>
        {subtitle && <span className="block text-[13px] text-[var(--bm-text-2)] truncate">{subtitle}</span>}
      </span>
      {value !== undefined && <span className="shrink-0 text-[15px] text-[var(--bm-text-2)]">{value}</span>}
      {chevron && <ChevronRight className="w-4 h-4 text-[var(--bm-text-3)] shrink-0" />}
    </Comp>
  );
};
