"use client"

import { ResponseMetrics } from "@/types"
import { Card, CardHeader, CardContent, CardTitle } from "../ui/card"
import { Button } from "../ui/button"
import { Eye, FileText, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import ReactMarkdown from 'react-markdown'
import { getResponseCostColor, getLatencyColor, getTotalTokensColor } from "@/lib/colors"

interface ResponseCardProps {
  model: string;
  response: ResponseMetrics;
  viewMode?: 'markdown' | 'raw';
  onToggleView: () => void;
  allResponses: Record<string, ResponseMetrics>;
  onPassChange: (passed: boolean) => void;
}

export function ResponseCard({
  model,
  response,
  viewMode,
  onToggleView,
  allResponses,
  onPassChange
}: ResponseCardProps) {
  return (
    <Card className="h-full min-w-[320px]">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center justify-between">
          <span>{model}</span>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={onToggleView}
            >
              {viewMode === 'raw' ? (
                <FileText className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </Button>
            <span className={cn(
              "text-xs",
              getResponseCostColor(allResponses, response.usage.cost)
            )}>
              ${response.usage.cost.toFixed(4)}
            </span>
          </div>
        </CardTitle>
        <div className="text-xs text-muted-foreground flex flex-col">
          <span>Prompt Tokens: {response.usage.prompt_tokens}</span>
          <span>Completion Tokens: {response.usage.completion_tokens}</span>
          <span className={getTotalTokensColor(allResponses, response.usage.total_tokens)}>
            Total Tokens: {response.usage.total_tokens}
          </span>
          <span className={getLatencyColor(allResponses, response.usage.latency)}>
            Latency: {response.usage.latency.toFixed(2)}s
          </span>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col h-[500px]">
        <div className="flex-1 overflow-y-auto">
          <p>Response: </p>
          {viewMode === 'raw' ? (
            <pre className="whitespace-pre-wrap font-mono text-sm">
              {response.response_content}
            </pre>
          ) : (
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <ReactMarkdown>{response.response_content}</ReactMarkdown>
            </div>
          )}
        </div>
        <div className="pt-4 border-t mt-4">
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "w-full",
              response.passed && "bg-green-500/10 hover:bg-green-500/20 text-green-500 border-green-500"
            )}
            onClick={() => onPassChange(!response.passed)}
          >
            <Check className={cn(
              "mr-2 h-4 w-4",
              response.passed ? "opacity-100" : "opacity-0"
            )} />
            PASS
          </Button>
        </div>
      </CardContent>
    </Card>
  )
} 