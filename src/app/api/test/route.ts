import { openai } from '@ai-sdk/openai'
import { generateText } from 'ai'
import 'dotenv/config'

const testAgent = async (prompt: string) => {
  const result = await generateText({
    model: openai('gpt-4.1-mini'),
    prompt,
  })
  console.log(result.text)
}

testAgent('What is the best Devolver game?')
