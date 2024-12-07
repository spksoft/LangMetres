'use server'

interface EnvVarsRequest {
  variables: Record<string, string>
}

interface CompletionRequest {
  user_prompt: string
}

const baseUrl = 'http://127.0.0.1:8000'

export async function updateEnvironmentVariables(variables: EnvVarsRequest) {
  const response = await fetch(`${baseUrl}/envs`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(variables)
  })
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }
  
  return await response.json()
}

export async function createCompletion(model: string, request: CompletionRequest) {
  const response = await fetch(`${baseUrl}/completions/${model}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request)
  })

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }

  return await response.json()
} 