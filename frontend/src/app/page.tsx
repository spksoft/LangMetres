"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"

interface TestCase {
  prompt: string;
  responses: Record<string, string>;
  loading?: boolean;
}

export default function Home() {
  const { toast } = useToast()
  const [envVars, setEnvVars] = useState("")
  const [selectedModels, setSelectedModels] = useState<string[]>([])
  const [testCases, setTestCases] = useState<TestCase[]>([{ prompt: "", responses: {}, loading: false }])
  const [isUpdatingEnv, setIsUpdatingEnv] = useState(false)
  
  const handleUpdateEnv = async () => {
    try {
      setIsUpdatingEnv(true)
      const variables = Object.fromEntries(
        envVars.split('\n')
          .map(line => line.split('='))
          .filter(([key]) => key.trim())
          .map(([key, value]) => [key.trim(), value?.trim()])
      )

      await fetch("http://localhost:8000/envs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ variables })
      })
      
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
    setTestCases([...testCases, { prompt: "", responses: {}, loading: false }])
  }

  const handleRunTest = async (index: number) => {
    const testCase = testCases[index]
    const newResponses: Record<string, string> = {}
    
    try {
      // Set loading state for this test case
      const updatedTestCases = [...testCases]
      updatedTestCases[index].loading = true
      setTestCases(updatedTestCases)

      for (const model of selectedModels) {
        try {
          const res = await fetch(`http://localhost:8000/completions/${model}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ user_prompt: testCase.prompt })
          })
          const data = await res.json()
          newResponses[model] = data.response.response_content
        } catch (error) {
          newResponses[model] = error instanceof Error ? 
            `Error: ${error.message}` : 
            "Error: Failed to get response"
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
                onChange={(e) => setEnvVars(e.target.value)}
                placeholder="Enter environment variables (one per line):&#10;OPENAI_API_KEY=sk-...&#10;ANTHROPIC_API_KEY=sk-..."
                className="min-h-[200px] font-mono"
              />
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
                  <Card key={index}>
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
                      {Object.entries(testCase.responses as Record<string, string>).map(([model, response]) => (
                        <Card key={model}>
                          <CardHeader>
                            <CardTitle className="text-sm">{model}</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="whitespace-pre-wrap">{response}</p>
                          </CardContent>
                        </Card>
                      ))}
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
