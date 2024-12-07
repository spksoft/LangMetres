"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Eye, FileText } from "lucide-react"
import ReactMarkdown from 'react-markdown'
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { updateEnvironmentVariables, createCompletion } from './actions'

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

export default function Home() {
  const { toast } = useToast()
  const [envVars, setEnvVars] = useState("")
  const [saveToStorage, setSaveToStorage] = useState(false)
  const [selectedModels, setSelectedModels] = useState<string[]>([])
  const [testCases, setTestCases] = useState<TestCase[]>([{ 
    prompt: "", 
    responses: {}, 
    loading: false,
    viewMode: {} 
  }])
  const [isUpdatingEnv, setIsUpdatingEnv] = useState(false)
  
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
    const newResponses: Record<string, ResponseMetrics> = {}
    
    try {
      const updatedTestCases = [...testCases]
      updatedTestCases[index].loading = true
      setTestCases(updatedTestCases)

      for (const model of selectedModels) {
        try {
          const data = await createCompletion(model, {
            user_prompt: testCase.prompt
          })
          newResponses[model] = data.response
        } catch (error) {
          newResponses[model] = {
            response_content: error instanceof Error ? 
              `Error: ${error.message}` : 
              "Error: Failed to get response",
            model_name: model,
            usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0, cost: 0, latency: 0 }
          }
        }
      }

      updatedTestCases[index].responses = newResponses
      updatedTestCases[index].loading = false
      setTestCases(updatedTestCases)
      
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
      
      const updatedTestCases = [...testCases]
      updatedTestCases[index].loading = false
      setTestCases(updatedTestCases)
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
              <CardTitle>Environment Variables</CardTitle>
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
              <CardTitle>Model Evaluation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <label>Select Models to Test</label>
                <Select
                  onValueChange={(value) => 
                    setSelectedModels(prev => 
                      prev.includes(value) ? prev : [...prev, value]
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Add model" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                    <SelectItem value="gpt-4">GPT-4</SelectItem>
                    <SelectItem value="claude-3-opus">Claude 3 Opus</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedModels.map((model) => (
                    <Button
                      key={model}
                      variant="secondary"
                      size="sm"
                      onClick={() => 
                        setSelectedModels(prev => 
                          prev.filter(m => m !== model)
                        )
                      }
                    >
                      {model} ×
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                {testCases.map((testCase, index) => (
                  <Card key={index} className="w-full">
                    <CardContent className="pt-6 space-y-4">
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
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {Object.entries(testCase.responses as Record<string, ResponseMetrics>).map(([model, response]) => (
                          <Card key={model} className="h-full">
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
    </main>
  )
}
