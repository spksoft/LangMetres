import * as XLSX from 'xlsx'
import { TestCase, ResponseMetrics } from "@/types"

interface ImportedRow {
  'Test Case': string;
  'Prompt': string;
  'Model': string;
  'Response': string;
  'Passed': string;
  'Prompt Tokens': number;
  'Completion Tokens': number;
  'Total Tokens': number;
  'Cost ($)': string;
  'Latency (s)': string;
}

export const importFromExcel = async (file: File): Promise<TestCase[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result
        const workbook = XLSX.read(data, { type: 'binary' })
        const worksheet = workbook.Sheets[workbook.SheetNames[0]]
        const rows = XLSX.utils.sheet_to_json<ImportedRow>(worksheet)

        // Group rows by test case
        const testCaseMap = new Map<string, TestCase>()
        
        rows.forEach(row => {
          const testCaseName = row['Test Case']
          if (!testCaseMap.has(testCaseName)) {
            testCaseMap.set(testCaseName, {
              name: testCaseName,
              prompt: row['Prompt'],
              responses: {},
              loading: false,
              viewMode: {}
            })
          }

          const testCase = testCaseMap.get(testCaseName)!
          const response: ResponseMetrics = {
            response_content: row['Response'],
            model_name: row['Model'],
            passed: row['Passed'].toLowerCase() === 'yes',
            usage: {
              prompt_tokens: row['Prompt Tokens'],
              completion_tokens: row['Completion Tokens'],
              total_tokens: row['Total Tokens'],
              cost: parseFloat(row['Cost ($)']),
              latency: parseFloat(row['Latency (s)'])
            }
          }

          testCase.responses[row['Model']] = response
        })

        resolve(Array.from(testCaseMap.values()))
      } catch (error) {
        reject(error)
      }
    }

    reader.onerror = () => {
      reject(new Error('Failed to read file'))
    }

    reader.readAsBinaryString(file)
  })
} 