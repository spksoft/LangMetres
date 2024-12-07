import { ResponseMetrics } from "@/types"

export const getResponseCostColor = (responses: Record<string, ResponseMetrics>, currentCost: number) => {
  const costs = Object.values(responses).map(r => r.usage.cost)
  const minCost = Math.min(...costs)
  const maxCost = Math.max(...costs)
  
  if (currentCost === minCost) return "text-green-500"
  if (currentCost === maxCost) return "text-red-500"
  return "text-muted-foreground"
}

export const getLatencyColor = (responses: Record<string, ResponseMetrics>, currentLatency: number) => {
  const latencies = Object.values(responses).map(r => r.usage.latency)
  const minLatency = Math.min(...latencies)
  const maxLatency = Math.max(...latencies)
  
  if (currentLatency === minLatency) return "text-green-500"
  if (currentLatency === maxLatency) return "text-red-500"
  return "text-muted-foreground"
}

export const getTotalTokensColor = (responses: Record<string, ResponseMetrics>, currentTokens: number) => {
  const tokens = Object.values(responses).map(r => r.usage.total_tokens)
  const minTokens = Math.min(...tokens)
  const maxTokens = Math.max(...tokens)
  
  if (currentTokens === minTokens) return "text-green-500"
  if (currentTokens === maxTokens) return "text-red-500"
  return "text-muted-foreground"
} 