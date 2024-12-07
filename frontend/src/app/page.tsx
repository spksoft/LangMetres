"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Eye, FileText } from "lucide-react"
import ReactMarkdown from 'react-markdown'
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { updateEnvironmentVariables, createCompletion } from './actions'
import modelPrice from '@/assets/litellm-1-53-7_model_price.json'
import { cn } from "@/lib/utils"

interface ResponseMetrics {
  response_content: string;
  model_name: string;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
    cost: number;
    latency: number;
  };
}

interface TestCase {
  prompt: string;
  responses: Record<string, ResponseMetrics>;
  loading?: boolean;
  viewMode?: Record<string, 'markdown' | 'raw'>;
}

interface ModelConfig {
  temperature: number;
  top_p: number;
}

interface ModelPriceEntry {
  mode: string;
  input_cost_per_token: number;
  output_cost_per_token: number;
  tokens_per_dollar?: {
    input_tokens: number;
    output_tokens: number;
  };
}

export default function Home() {
  const { toast } = useToast()
  const [envVars, setEnvVars] = useState("")
  const [saveToStorage, setSaveToStorage] = useState(false)
  const [selectedModels, setSelectedModels] = useState<string[]>([])
  const [modelConfigs, setModelConfigs] = useState<Record<string, ModelConfig>>({})
  const [testCases, setTestCases] = useState<TestCase[]>([{ 
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
      setTestCases(data.testCases ?? [{ 
        prompt: "", 
        responses: {}, 
        loading: false,
        viewMode: {},
      }])
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
    setTestCases([...testCases, { prompt: "", responses: {}, loading: false, viewMode: {} }])
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
              [model]: data.response
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

  return (
    <main className="container mx-auto p-4">
      <Tabs defaultValue="env" className="max-w-4xl mx-auto">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="env">Environment Variables</TabsTrigger>
          <TabsTrigger value="eval">Model Evaluation</TabsTrigger>
        </TabsList>

        <TabsContent value="env">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Environment Variables</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    localStorage.removeItem('envVars')
                    localStorage.removeItem('saveEnvVars')
                    setEnvVars('')
                    setSaveToStorage(false)
                    toast({
                      title: "Reset Complete",
                      description: "Environment variables have been cleared",
                    })
                  }}
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
                value={envVars}
                onChange={(e) => handleEnvVarsChange(e.target.value)}
                placeholder="Enter environment variables (one per line):&#10;OPENAI_API_KEY=sk-...&#10;ANTHROPIC_API_KEY=sk-..."
                className="min-h-[200px] font-mono"
              />
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="saveEnv" 
                  checked={saveToStorage}
                  onCheckedChange={handleSaveToggle}
                />
                <Label 
                  htmlFor="saveEnv" 
                  className="text-sm text-muted-foreground cursor-pointer"
                >
                  Save ENV in LocalStorage
                </Label>
              </div>
              <Button 
                onClick={handleUpdateEnv} 
                className="w-full"
                disabled={isUpdatingEnv}
              >
                {isUpdatingEnv ? (
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
        </TabsContent>

        <TabsContent value="eval">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Model Evaluation</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    localStorage.removeItem('modelEvalData')
                    setSelectedModels([])
                    setModelConfigs({})
                    setTestCases([{ 
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
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <label>Select Models to Test</label>
                <Select
                  onValueChange={(value) => {
                    if (!selectedModels.includes(value)) {
                      setSelectedModels(prev => [...prev, value])
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Add model" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {availableChatModels.map((modelId) => (
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
                        onClick={() => {
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
                      >
                        {model} ×
                      </Button>
                      <div className="space-y-2">
                        <Label>Temperature</Label>
                        <input 
                          type="range"
                          min="0"
                          max="2"
                          step="0.1"
                          value={modelConfigs[model]?.temperature ?? 0.7}
                          onChange={(e) => {
                            setModelConfigs(prev => ({
                              ...prev,
                              [model]: {
                                ...prev[model],
                                temperature: Number(e.target.value)
                              }
                            }))
                          }}
                          className="w-full"
                        />
                        <div className="text-xs text-muted-foreground text-center">
                          {modelConfigs[model]?.temperature ?? 0.7}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Top P</Label>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.1"
                          value={modelConfigs[model]?.top_p ?? 1}
                          onChange={(e) => {
                            setModelConfigs(prev => ({
                              ...prev,
                              [model]: {
                                ...prev[model],
                                top_p: Number(e.target.value)
                              }
                            }))
                          }}
                          className="w-full"
                        />
                        <div className="text-xs text-muted-foreground text-center">
                          {modelConfigs[model]?.top_p ?? 1}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                {testCases.map((testCase, index) => (
                  <Card key={index} className="w-full">
                    <CardContent className="pt-6 space-y-4">
                      <div className="flex justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-muted-foreground hover:text-destructive"
                          onClick={() => setTestCases(prev => prev.filter((_, i) => i !== index))}
                          disabled={testCases.length === 1}
                        >
                          Delete
                        </Button>
                      </div>
                      <Textarea
                        value={testCase.prompt}
                        onChange={(e) => {
                          const updated = [...testCases]
                          updated[index].prompt = e.target.value
                          setTestCases(updated)
                        }}
                        placeholder="Enter test prompt"
                      />
                      <Button 
                        onClick={() => handleRunTest(index)}
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
                          <Card key={model} className="h-full min-w-[320px]">
                            <CardHeader className="pb-2">
                              <CardTitle className="text-sm flex items-center justify-between">
                                <span>{model}</span>
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={() => toggleView(index, model)}
                                  >
                                    {testCase.viewMode?.[model] === 'raw' ? (
                                      <FileText className="h-4 w-4" />
                                    ) : (
                                      <Eye className="h-4 w-4" />
                                    )}
                                  </Button>
                                  <span className="text-xs text-muted-foreground">
                                    ${response.usage.cost.toFixed(4)}
                                  </span>
                                </div>
                              </CardTitle>
                              <div className="text-xs text-muted-foreground flex flex-col">
                                <span>Prompt Tokens: {response.usage.prompt_tokens}</span>
                                <span>Completion Tokens: {response.usage.completion_tokens}</span>
                                <span>Total Tokens: {response.usage.total_tokens}</span>
                                <span>Latency: {response.usage.latency.toFixed(2)}s</span>
                              </div>
                            </CardHeader>
                            <CardContent className="h-[500px] overflow-y-auto">
                              <p>Response: </p>
                              {testCase.viewMode?.[model] === 'raw' ? (
                                <pre className="whitespace-pre-wrap font-mono text-sm">
                                  {response.response_content}
                                </pre>
                              ) : (
                                <div className="prose prose-sm dark:prose-invert max-w-none">
                                  <ReactMarkdown>{response.response_content}</ReactMarkdown>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
                <Button 
                  onClick={handleAddTestCase}
                  variant="outline"
                  className="w-full"
                >
                  Add Test Case
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      <footer className="text-center mt-8 text-sm text-muted-foreground">
        Made with ❤️ and 🤖 by{" "}
        <a 
          href="https://github.com/spksoft" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-primary hover:underline"
        >
          @spksoft
        </a>
      </footer>
    </main>
  )
}