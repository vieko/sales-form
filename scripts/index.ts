import { openai } from '@ai-sdk/openai'
import { streamText } from 'ai'
import { config } from 'dotenv'

config({ path: '.env.local' })

const testAgent = async (prompt: string) => {
  try {
    if (!process.env.AI_GATEWAY_API_KEY) {
      throw new Error('AI_GATEWAY_API_KEY environment variable is not set')
    }

    const result = await streamText({
      model: openai('gpt-4.1-mini'),
      system: '',
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

testAgent('Devolver Digital')
