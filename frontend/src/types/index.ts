export interface ResponseMetrics {
  response_content: string;
  model_name: string;
  passed?: boolean;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
    cost: number;
    latency: number;
  };
}

export interface TestCase {
  name: string;
  prompt: string;
  responses: Record<string, ResponseMetrics>;
  loading?: boolean;
  viewMode?: Record<string, 'markdown' | 'raw'>;
}

export interface ModelConfig {
  temperature: number;
  top_p: number;
}

export interface ModelPriceEntry {
  mode: string;
  input_cost_per_token: number;
  output_cost_per_token: number;
  tokens_per_dollar?: {
    input_tokens: number;
    output_tokens: number;
  };
}

export interface ExportRow {
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