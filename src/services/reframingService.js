import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';

const useAnthropic = process.env.USE_ANTHROPIC_FOR_REFRAMING === 'true';

let openaiClient = null;
let anthropicClient = null;

if (!useAnthropic && process.env.OPENAI_API_KEY) {
  openaiClient = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });
}

if (useAnthropic && process.env.ANTHROPIC_API_KEY) {
  anthropicClient = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY
  });
}

export const reframeText = async (transcript) => {
  if (useAnthropic) {
    return await reframeWithAnthropic(transcript);
  } else {
    return await reframeWithOpenAI(transcript);
  }
};

const reframeWithOpenAI = async (transcript) => {
  if (!openaiClient) {
    throw new Error('OpenAI API key not configured');
  }

  try {
    const response = await openaiClient.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `You are a helpful assistant that reframes negative or unhelpful thoughts into more positive, constructive, and empowering perspectives. 
          Your goal is to help people see situations from a different, more helpful angle while maintaining authenticity and not being overly dismissive of their feelings.
          Return only the reframed text, without additional commentary or explanation.`
        },
        {
          role: 'user',
          content: `Please reframe the following thought in a more positive and constructive way:\n\n"${transcript}"`
        }
      ],
      temperature: 0.7,
      max_tokens: 500
    });

    return response.choices[0].message.content.trim();
  } catch (error) {
    console.error('OpenAI reframing error:', error);
    throw new Error(`Reframing failed: ${error.message}`);
  }
};

const reframeWithAnthropic = async (transcript) => {
  if (!anthropicClient) {
    throw new Error('Anthropic API key not configured');
  }

  try {
    const message = await anthropicClient.messages.create({
      model: 'claude-3-opus-20240229', // or 'claude-3-sonnet-20240229' for faster/cheaper
      max_tokens: 500,
      system: `You are a helpful assistant that reframes negative or unhelpful thoughts into more positive, constructive, and empowering perspectives. 
      Your goal is to help people see situations from a different, more helpful angle while maintaining authenticity and not being overly dismissive of their feelings.
      Return only the reframed text, without additional commentary or explanation.`,
      messages: [
        {
          role: 'user',
          content: `Please reframe the following thought in a more positive and constructive way:\n\n"${transcript}"`
        }
      ]
    });

    return message.content[0].text.trim();
  } catch (error) {
    console.error('Anthropic reframing error:', error);
    throw new Error(`Reframing failed: ${error.message}`);
  }
};

