"use client"

import { Label } from "@/components/ui/label"

interface ModelConfigSliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
}

export function ModelConfigSlider({
  label,
  value,
  min,
  max,
  step,
  onChange
}: ModelConfigSliderProps) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <input 
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full"
      />
      <div className="text-xs text-muted-foreground text-center">
        {value}
      </div>
    </div>
  )
} 