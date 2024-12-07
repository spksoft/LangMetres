"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { updateEnvironmentVariables, createCompletion } from './actions'
import modelPrice from '@/assets/litellm-1-53-7_model_price.json'
import { TestCase, ModelConfig, ModelPriceEntry } from "@/types"
import { ModelSelector } from "@/components/model-selection/model-selector"
import { exportToExcel } from "@/lib/export"
import { EnvSettings } from "@/components/env-settings/env-settings"
import { TestCaseList } from "@/components/test-case/test-case-list"
import { Footer } from "@/components/layout/footer"
import { importFromExcel } from "@/lib/import"

export default function Home() {
  const { toast } = useToast()
  const [envVars, setEnvVars] = useState("")
  const [saveToStorage, setSaveToStorage] = useState(false)
  const [selectedModels, setSelectedModels] = useState<string[]>([])
  const [modelConfigs, setModelConfigs] = useState<Record<string, ModelConfig>>({})
  const [testCases, setTestCases] = useState<TestCase[]>([{ 
    name: "Test Case 1",
    prompt: "", 
    responses: {}, 
    loading: false,
    viewMode: {},
  }])
  const [isUpdatingEnv, setIsUpdatingEnv] = useState(false)
  
  // Load all data from localStorage
  useEffect(() => {
    const savedData = localStorage.getItem('modelEvalData')
    if (savedData) {
      const data = JSON.parse(savedData)
      setSelectedModels(data.selectedModels ?? [])
      setModelConfigs(data.modelConfigs ?? {})
      setTestCases(
        data.testCases?.map((tc: TestCase, index: number) => ({
          ...tc,
          name: tc.name || `Test Case ${index + 1}`
        })) ?? [{ 
          name: "Test Case 1",
          prompt: "", 
          responses: {}, 
          loading: false,
          viewMode: {},
        }]
      )
    }
  }, [])

  // Save all data to localStorage whenever it changes
  useEffect(() => {
    const dataToSave = {
      selectedModels,
      modelConfigs,
      testCases: testCases.map(tc => ({
        ...tc,
        loading: false // Don't save loading state
      }))
    }
    localStorage.setItem('modelEvalData', JSON.stringify(dataToSave))
  }, [selectedModels, modelConfigs, testCases])

  // Load initial values from localStorage
  useEffect(() => {
    const savedEnvVars = localStorage.getItem('envVars')
    const shouldSave = localStorage.getItem('saveEnvVars') === 'true'
    
    if (savedEnvVars && shouldSave) {
      setEnvVars(savedEnvVars)
    }
    setSaveToStorage(shouldSave)
  }, [])

  const handleUpdateEnv = async () => {
    try {
      setIsUpdatingEnv(true)
      const variables = Object.fromEntries(
        envVars.split('\n')
          .map(line => line.split('='))
          .filter(([key]) => key.trim())
          .map(([key, value]) => [key.trim(), value?.trim()])
      )

      await updateEnvironmentVariables({ variables })
      
      toast({
        title: "Success",
        description: "Environment variables updated successfully",
      })
    } catch (error) {
      toast({
        variant: "destructive", 
        title: "Error",
        description: error instanceof Error ? error.message : "An unknown error occurred",
      })
    } finally {
      setIsUpdatingEnv(false)
    }
  }

  const handleAddTestCase = () => {
    setTestCases([...testCases, { 
      name: `Test Case ${testCases.length + 1}`,
      prompt: "", 
      responses: {}, 
      loading: false, 
      viewMode: {} 
    }])
  }

  const handleRunTest = async (index: number) => {
    const testCase = testCases[index]
    
    try {
      const updatedTestCases = [...testCases]
      updatedTestCases[index].loading = true
      setTestCases(updatedTestCases)

      // Create array of promises for each model
      const promises = selectedModels.map(async (model) => {
        try {
          const data = await createCompletion(model, {
            model,
            user_prompt: testCase.prompt,
            temperature: modelConfigs[model]?.temperature ?? 0.7,
            top_p: modelConfigs[model]?.top_p ?? 1
          })
          
          // Update responses immediately when each completion finishes
          setTestCases(prev => {
            const updated = [...prev]
            updated[index].responses = {
              ...updated[index].responses,
              [model]: {
                ...data.response,
                passed: false
              }
            }
            return updated
          })

        } catch (error) {
          // Handle individual model errors
          setTestCases(prev => {
            const updated = [...prev]
            updated[index].responses = {
              ...updated[index].responses,
              [model]: {
                response_content: error instanceof Error ? 
                  `Error: ${error.message}` : 
                  "Error: Failed to get response",
                model_name: model,
                usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0, cost: 0, latency: 0 }
              }
            }
            return updated
          })
        }
      })

      // Wait for all completions but don't block UI updates
      await Promise.all(promises)
      
      setTestCases(prev => {
        const updated = [...prev]
        updated[index].loading = false
        return updated
      })

      toast({
        title: "Success",
        description: "Test completed successfully",
      })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error", 
        description: error instanceof Error ? error.message : "An unknown error occurred",
      })
      
      setTestCases(prev => {
        const updated = [...prev]
        updated[index].loading = false
        return updated
      })
    }
  }

  const toggleView = (testCaseIndex: number, model: string) => {
    const updatedTestCases = [...testCases]
    const currentMode = updatedTestCases[testCaseIndex].viewMode?.[model] || 'markdown'
    updatedTestCases[testCaseIndex].viewMode = {
      ...updatedTestCases[testCaseIndex].viewMode,
      [model]: currentMode === 'markdown' ? 'raw' : 'markdown'
    }
    setTestCases(updatedTestCases)
  }

  // Handle save toggle
  const handleSaveToggle = (checked: boolean) => {
    setSaveToStorage(checked)
    localStorage.setItem('saveEnvVars', String(checked))
    if (checked) {
      localStorage.setItem('envVars', envVars)
    } else {
      localStorage.removeItem('envVars')
    }
  }

  // Handle env vars change
  const handleEnvVarsChange = (value: string) => {
    setEnvVars(value)
    if (saveToStorage) {
      localStorage.setItem('envVars', value)
    }
  }

  const availableChatModels = Object.entries(modelPrice as unknown as Record<string, ModelPriceEntry>)
    .filter(([, value]) => 
      value.mode === 'chat' && 
      'input_cost_per_token' in value && 
      'output_cost_per_token' in value
    )
    .map(([key]) => key)
    .sort((a, b) => a.localeCompare(b))

  const handlePassChange = (testCaseIndex: number, model: string, passed: boolean) => {
    setTestCases(prev => {
      const updated = [...prev]
      if (updated[testCaseIndex].responses[model]) {
        updated[testCaseIndex].responses[model].passed = passed
      }
      return updated
    })
  }

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const importedTestCases = await importFromExcel(file)
      
      // Get all unique models from imported test cases
      const models = new Set<string>()
      importedTestCases.forEach(tc => {
        Object.keys(tc.responses).forEach(model => models.add(model))
      })

      setSelectedModels(Array.from(models))
      setTestCases(importedTestCases)
      
      toast({
        title: "Success",
        description: "Test cases imported successfully",
      })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to import file",
      })
    }

    // Reset input
    event.target.value = ''
  }

  return (
    <main className="container mx-auto p-4">
      <Tabs defaultValue="env" className="max-w-4xl mx-auto">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="env">Environment Variables</TabsTrigger>
          <TabsTrigger value="eval">Model Evaluation</TabsTrigger>
        </TabsList>

        <TabsContent value="env">
          <EnvSettings
            envVars={envVars}
            saveToStorage={saveToStorage}
            isUpdating={isUpdatingEnv}
            onEnvChange={handleEnvVarsChange}
            onSaveToggle={handleSaveToggle}
            onUpdate={handleUpdateEnv}
            onReset={() => {
              localStorage.removeItem('envVars')
              localStorage.removeItem('saveEnvVars')
              setEnvVars('')
              setSaveToStorage(false)
              toast({
                title: "Reset Complete",
                description: "Environment variables have been cleared",
              })
            }}
          />
        </TabsContent>

        <TabsContent value="eval">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Model Evaluation</CardTitle>
                <div className="flex gap-2">
                  <input
                    type="file"
                    accept=".xlsx"
                    className="hidden"
                    id="import-excel"
                    onChange={handleImport}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => document.getElementById('import-excel')?.click()}
                  >
                    Import Results
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => exportToExcel(testCases)}
                    disabled={Object.keys(testCases[0].responses).length === 0}
                  >
                    Export Results
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      localStorage.removeItem('modelEvalData')
                      setSelectedModels([])
                      setModelConfigs({})
                      setTestCases([{ 
                        name: "Test Case 1",
                        prompt: "", 
                        responses: {}, 
                        loading: false,
                        viewMode: {},
                      }])
                      toast({
                        title: "Reset Complete",
                        description: "Model evaluation data has been cleared",
                      })
                    }}
                  >
                    Reset Storage
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <ModelSelector
                availableModels={availableChatModels}
                selectedModels={selectedModels}
                modelConfigs={modelConfigs}
                onModelSelect={(value) => {
                  if (!selectedModels.includes(value)) {
                    setSelectedModels(prev => [...prev, value])
                  }
                }}
                onModelRemove={(model) => {
                  setSelectedModels(prev => prev.filter(m => m !== model))
                  setModelConfigs(prev => {
                    const next = { ...prev }
                    delete next[model]
                    return next
                  })
                  setTestCases(prev => prev.map(testCase => ({
                    ...testCase,
                    responses: Object.fromEntries(
                      Object.entries(testCase.responses)
                        .filter(([key]) => key !== model)
                    )
                  })))
                }}
                onConfigChange={(model, config) => {
                  setModelConfigs(prev => ({
                    ...prev,
                    [model]: {
                      ...prev[model],
                      ...config
                    }
                  }))
                }}
              />

              <TestCaseList
                testCases={testCases}
                selectedModels={selectedModels}
                onDelete={(index) => setTestCases(prev => prev.filter((_, i) => i !== index))}
                onNameChange={(index, name) => {
                  const updated = [...testCases]
                  updated[index].name = name
                  setTestCases(updated)
                }}
                onPromptChange={(index, prompt) => {
                  const updated = [...testCases]
                  updated[index].prompt = prompt
                  setTestCases(updated)
                }}
                onRun={handleRunTest}
                onToggleView={toggleView}
                onAdd={handleAddTestCase}
                onPassChange={handlePassChange}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      <Footer />
    </main>
  )
}