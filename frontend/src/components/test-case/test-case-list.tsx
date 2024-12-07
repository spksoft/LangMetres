"use client"

import { Button } from "@/components/ui/button"
import { TestCase } from "@/types"
import { TestCaseCard } from "./test-case-card"

interface TestCaseListProps {
  testCases: TestCase[];
  selectedModels: string[];
  onDelete: (index: number) => void;
  onNameChange: (index: number, name: string) => void;
  onPromptChange: (index: number, prompt: string) => void;
  onRun: (index: number) => void;
  onToggleView: (index: number, model: string) => void;
  onAdd: () => void;
  onPassChange: (index: number, model: string, passed: boolean) => void;
}

export function TestCaseList({
  testCases,
  selectedModels,
  onDelete,
  onNameChange,
  onPromptChange,
  onRun,
  onToggleView,
  onAdd,
  onPassChange
}: TestCaseListProps) {
  return (
    <div className="space-y-4">
      {testCases.map((testCase, index) => (
        <TestCaseCard
          key={index}
          testCase={testCase}
          index={index}
          onDelete={() => onDelete(index)}
          onNameChange={(name) => onNameChange(index, name)}
          onPromptChange={(prompt) => onPromptChange(index, prompt)}
          onRun={() => onRun(index)}
          onToggleView={(model) => onToggleView(index, model)}
          canDelete={testCases.length > 1}
          selectedModels={selectedModels}
          onPassChange={(model, passed) => onPassChange(index, model, passed)}
        />
      ))}
      <Button 
        onClick={onAdd}
        variant="outline"
        className="w-full"
      >
        Add Test Case
      </Button>
    </div>
  )
} 