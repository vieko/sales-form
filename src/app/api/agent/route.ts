import { getPrompt } from '@/lib/prompts'
import { webScraper } from '@/lib/tools'
import { openai } from '@ai-sdk/openai'
import { stepCountIs, streamText } from 'ai'

const agent = async (prompt: string) => {
  try {
    const result = streamText({
      model: openai('gpt-4o-mini'),
      system: getPrompt('sdrResearch'),
      prompt,
      tools: {
        webScraper,
      },
      stopWhen: stepCountIs(10),
    })

    for await (const chunk of result.fullStream) {
      if (chunk.type === 'text-delta') {
        process.stdout.write(chunk.text)
      }
      if (chunk.type === 'tool-call') {
        console.log('tool call', chunk)
      }
      if (chunk.type === 'tool-result') {
        console.log('tool result', chunk)
      }
    }
  } catch (error) {
    console.error('Agent Error:', error)
  }
}

agent('devolverdigital.com')
