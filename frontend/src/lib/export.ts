import * as XLSX from 'xlsx'
import { TestCase, ExportRow } from "@/types"

export const prepareExportData = (testCases: TestCase[]) => {
  const rows: ExportRow[] = []
  
  testCases.forEach((testCase) => {
    Object.entries(testCase.responses).forEach(([model, response]) => {
      rows.push({
        'Test Case': testCase.name,
        'Prompt': testCase.prompt,
        'Model': model,
        'Response': response.response_content,
        'Passed': response.passed ? 'Yes' : 'No',
        'Prompt Tokens': response.usage.prompt_tokens,
        'Completion Tokens': response.usage.completion_tokens,
        'Total Tokens': response.usage.total_tokens,
        'Cost ($)': response.usage.cost.toFixed(4),
        'Latency (s)': response.usage.latency.toFixed(2)
      })
    })
  })
  
  return rows
}

export const exportToExcel = (testCases: TestCase[]) => {
  const data = prepareExportData(testCases)
  const ws = XLSX.utils.json_to_sheet(data)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Evaluation Results')
  XLSX.writeFile(wb, `langmetres-evaluation-${new Date().toISOString().split('T')[0]}.xlsx`)
} 