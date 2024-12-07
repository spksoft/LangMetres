"use client"

import { TestCase, ResponseMetrics } from "@/types"
import { ResponseCard } from "@/components/test-case/response-card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

interface TestCaseCardProps {
  testCase: TestCase;
  index: number;
  onDelete: () => void;
  onNameChange: (name: string) => void;
  onPromptChange: (prompt: string) => void;
  onRun: () => void;
  onToggleView: (model: string) => void;
  canDelete: boolean;
  selectedModels: string[];
  onPassChange: (model: string, passed: boolean) => void;
}

export function TestCaseCard({
  testCase,
  onDelete,
  onNameChange,
  onPromptChange,
  onRun,
  onToggleView,
  canDelete,
  selectedModels,
  onPassChange
}: TestCaseCardProps) {
  return (
    <Card className="w-full">
      <CardContent className="pt-6 space-y-4">
        <div className="flex justify-between items-center">
          <input
            type="text"
            value={testCase.name}
            onChange={(e) => onNameChange(e.target.value)}
            className="w-full text-lg font-medium bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-ring rounded px-2"
            placeholder="Enter test case name"
          />
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-destructive"
            onClick={onDelete}
            disabled={!canDelete}
          >
            Delete
          </Button>
        </div>
        <Textarea
          rows={10}
          value={testCase.prompt}
          onChange={(e) => onPromptChange(e.target.value)}
          placeholder="Enter test prompt"
        />
        <Button 
          onClick={onRun}
          disabled={selectedModels.length === 0 || testCase.loading}
        >
          {testCase.loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Running...
            </>
          ) : (
            "Run Test"
          )}
        </Button>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {Object.entries(testCase.responses as Record<string, ResponseMetrics>).map(([model, response]) => (
            <ResponseCard
              key={model}
              model={model}
              response={response}
              viewMode={testCase.viewMode?.[model]}
              onToggleView={() => onToggleView(model)}
              allResponses={testCase.responses}
              onPassChange={(passed) => onPassChange(model, passed)}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  )
} 