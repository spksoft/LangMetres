"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Loader2 } from "lucide-react"

interface EnvSettingsProps {
  envVars: string;
  saveToStorage: boolean;
  isUpdating: boolean;
  onEnvChange: (value: string) => void;
  onSaveToggle: (checked: boolean) => void;
  onUpdate: () => Promise<void>;
  onReset: () => void;
}

export function EnvSettings({
  envVars,
  saveToStorage,
  isUpdating,
  onEnvChange,
  onSaveToggle,
  onUpdate,
  onReset
}: EnvSettingsProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Environment Variables</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onReset}
          >
            Reset Storage
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          Environment Variables config can see from{" "}
          <a 
            href="https://docs.litellm.ai/docs/providers/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            LiteLLM Document
          </a>
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea
          rows={10}
          value={envVars}
          onChange={(e) => onEnvChange(e.target.value)}
          placeholder="Enter environment variables (one per line):&#10;OPENAI_API_KEY=sk-...&#10;ANTHROPIC_API_KEY=sk-..."
          className="min-h-[200px] font-mono"
        />
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="saveEnv" 
            checked={saveToStorage}
            onCheckedChange={onSaveToggle}
          />
          <Label 
            htmlFor="saveEnv" 
            className="text-sm text-muted-foreground cursor-pointer"
          >
            Save ENV in LocalStorage
          </Label>
        </div>
        <Button 
          onClick={onUpdate} 
          className="w-full"
          disabled={isUpdating}
        >
          {isUpdating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Updating...
            </>
          ) : (
            "Update Environment"
          )}
        </Button>
      </CardContent>
    </Card>
  )
} 