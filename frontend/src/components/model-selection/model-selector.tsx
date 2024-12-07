"use client"

import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { ModelConfig } from "@/types"
import { ModelConfigSlider } from "./model-config-slider"

interface ModelSelectorProps {
  availableModels: string[];
  selectedModels: string[];
  modelConfigs: Record<string, ModelConfig>;
  onModelSelect: (value: string) => void;
  onModelRemove: (model: string) => void;
  onConfigChange: (model: string, config: Partial<ModelConfig>) => void;
}

export function ModelSelector({
  availableModels,
  selectedModels,
  modelConfigs,
  onModelSelect,
  onModelRemove,
  onConfigChange
}: ModelSelectorProps) {
  return (
    <div className="space-y-2">
      <div className="space-y-1">
        <label>Select Models to Test</label>
        <p className="text-sm text-muted-foreground">
          See{" "}
          <a 
            href="https://docs.litellm.ai/docs/providers" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            LiteLLM documents
          </a>
          {" "}for more information
        </p>
      </div>
      <Select onValueChange={onModelSelect}>
        <SelectTrigger>
          <SelectValue placeholder="Add model" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {availableModels.map((modelId) => (
              <SelectItem key={modelId} value={modelId}>
                {modelId}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
      <div className="flex gap-2 mt-2 overflow-x-auto pb-2 no-wrap">
        {selectedModels.map((model) => (
          <div key={model} className="flex flex-col gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onModelRemove(model)}
            >
              {model} ×
            </Button>
            <ModelConfigSlider
              label="Temperature"
              value={modelConfigs[model]?.temperature ?? 0.7}
              min={0}
              max={2}
              step={0.1}
              onChange={(value) => onConfigChange(model, { temperature: value })}
            />
            <ModelConfigSlider
              label="Top P"
              value={modelConfigs[model]?.top_p ?? 1}
              min={0}
              max={1}
              step={0.1}
              onChange={(value) => onConfigChange(model, { top_p: value })}
            />
          </div>
        ))}
      </div>
    </div>
  )
} 