import { openai } from '@ai-sdk/openai'
import { streamText } from 'ai'
import { getPrompt } from '@/lib/prompts'

const agent = async (prompt: string) => {
  try {
    const result = await streamText({
      model: openai('gpt-4.1-mini'),
      system: getPrompt('sdrResearch'),
      prompt,
    })

    for await (const chunk of result.fullStream) {
      if (chunk.type === 'text-delta') {
        process.stdout.write(chunk.text)
      }
    }
  } catch (error) {
    console.error('Error:', error)
  }
}

agent('Devolver Digital')
