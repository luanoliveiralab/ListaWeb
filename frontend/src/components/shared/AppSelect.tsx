"use client";

import type { ReactNode } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export interface AppSelectOption {
  value: string;
  label: ReactNode;
  disabled?: boolean;
}

interface AppSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  options: AppSelectOption[];
  placeholder?: string;
  id?: string;
  className?: string;
  disabled?: boolean;
  required?: boolean;
  ariaLabel?: string;
}

export default function AppSelect({
  value,
  onValueChange,
  options,
  placeholder = "Selecione uma opção",
  id,
  className,
  disabled,
  required,
  ariaLabel,
}: AppSelectProps) {
  return (
    <Select
      value={value || null}
      onValueChange={(nextValue) => onValueChange(nextValue ?? "")}
      disabled={disabled}
      required={required}
    >
      <SelectTrigger
        id={id}
        aria-label={ariaLabel}
        className={cn("control justify-between px-3.5", className)}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent align="start" sideOffset={6} className="rounded-xl border border-border bg-popover p-1.5 shadow-xl">
        {options.map((option) => (
          <SelectItem
            key={option.value}
            value={option.value}
            disabled={option.disabled}
            className="min-h-10 cursor-pointer rounded-lg px-3 py-2 pr-9 data-highlighted:bg-accent data-highlighted:text-accent-foreground"
          >
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
