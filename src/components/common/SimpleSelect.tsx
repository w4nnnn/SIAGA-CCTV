"use client";

import * as React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export interface SelectOption {
  value: string;
  label: string;
}

interface SimpleSelectProps {
  id?: string;
  value: string;
  onValueChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function SimpleSelect({
  id,
  value,
  onValueChange,
  options,
  placeholder = "Pilih...",
  className,
  disabled,
}: SimpleSelectProps) {
  const items = React.useMemo(
    () => options.map((opt) => ({ value: opt.value, label: opt.label })),
    [options]
  );

  return (
    <Select
      items={items}
      value={value}
      onValueChange={(val) => {
        if (typeof val === "string") onValueChange(val);
      }}
      disabled={disabled}
    >
      <SelectTrigger id={id} className={cn("w-full justify-between", className)}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent align="start" className="min-w-[180px]">
        {options.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
