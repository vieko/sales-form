import { sdrResearchPrompt } from './sdr-research'

export const prompts = {
  sdrResearch: sdrResearchPrompt,
} as const

export type PromptKey = keyof typeof prompts

export function getPrompt(key: PromptKey): string {
  return prompts[key]
}

// Alternative: load from file system for even more flexibility
export async function loadPromptFromFile(filename: string): Promise<string> {
  try {
    const fs = await import('fs/promises')
    const path = await import('path')
    const promptPath = path.join(process.cwd(), 'src/lib/prompts', filename)
    return await fs.readFile(promptPath, 'utf-8')
  } catch (error) {
    console.error(`Failed to load prompt from file: ${filename}`, error)
    throw new Error(`Prompt file not found: ${filename}`)
  }
}

// Template-based prompts with variable substitution
export function createTemplatedPrompt(template: string, variables: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return variables[key] || match
  })
}