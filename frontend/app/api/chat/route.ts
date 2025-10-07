import { NextRequest, NextResponse } from 'next/server';
import { OpenAI } from 'openai';
import { SYSTEM_PROMPT } from '@/lib/prompt';
import { loadSession, saveSession, nextModeFromUserText, type Turn } from '@/lib/state';

export const runtime = 'edge';

const openai = new OpenAI({
  apiKey: process.env.AZURE_OPENAI_KEY,
  baseURL: `${process.env.AZURE_OPENAI_ENDPOINT}/openai/deployments/${process.env.AZURE_OPENAI_CHAT_DEPLOYMENT}`,
  defaultQuery: { 'api-version': '2024-08-01-preview' },
  defaultHeaders: { 'api-key': process.env.AZURE_OPENAI_KEY! },
});

function openingBundle(): Turn[] {
  return [
    {
      role: 'system',
      content: `You are a medical student preparing to see the next patient in the ED, Ms. Esposito. Here's the triage note: Ms. Esposito, 31F, woke up at 0600 with 'fever and chills.' She also feels fatigued and has some right-sided abdominal pain. She returned last week from a vacation in the Dominican Republic. PMH includes ectopic pregnancy (5 years ago). POC pregnancy test is negative. No one has yet taken a full history.`,
      timestamp: Date.now()
    },
    {
      role: 'system',
      content: 'Your patient is sitting in the clinic room awaiting your arrival. Start the visit.',
      timestamp: Date.now()
    },
    {
      role: 'assistant',
      content: 'Hi, my name is Ms Esposito. I am here for my clinical visit. I hope you can help me!',
      timestamp: Date.now()
    }
  ];
}

export async function POST(req: NextRequest) {
  try {
    const { caseId = 'default', sessionId, userText, message, stream = true } = await req.json();
    const text = userText || message;

    if (!sessionId || !text) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Load session
    const session = await loadSession(caseId, sessionId);
    let turns = session.turns;

    // First time - add system prompt and opening
    if (!session.opened) {
      turns = [
        { role: 'system', content: SYSTEM_PROMPT, timestamp: Date.now() },
        ...openingBundle()
      ];
    }

    // Determine mode
    const mode = nextModeFromUserText(text, session.mode);

    // Add user message
    turns.push({ role: 'user', content: text, timestamp: Date.now() });

    // Build messages for Azure OpenAI (last 30 turns for context)
    const messages = turns
      .slice(-30)
      .map(t => ({
        role: t.role as 'system' | 'user' | 'assistant',
        content: t.content
      }));

    // Non-streaming mode for voice
    if (!stream) {
      const completion = await openai.chat.completions.create({
        model: process.env.AZURE_OPENAI_CHAT_DEPLOYMENT!,
        messages,
        stream: false,
        max_tokens: 150,
        temperature: 0.7
      });

      const response = completion.choices[0]?.message?.content || '';

      // Save session
      turns.push({
        role: 'assistant',
        content: response,
        timestamp: Date.now()
      });

      await saveSession(caseId, sessionId, {
        mode,
        turns,
        opened: true
      });

      return NextResponse.json({ response });
    }

    // Streaming response from gpt-4o
    const streamResponse = await openai.chat.completions.create({
      model: process.env.AZURE_OPENAI_CHAT_DEPLOYMENT!,
      messages,
      stream: true,
      max_tokens: 150,
      temperature: 0.7
    });

    // Convert OpenAI stream to SSE format (Server-Sent Events)
    const encoder = new TextEncoder();
    let fullResponse = '';

    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of streamResponse) {
            const content = chunk.choices[0]?.delta?.content || '';
            if (content) {
              fullResponse += content;
              // Send SSE formatted data
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ choices: [{ delta: { content } }] })}\n\n`));
            }
          }

          // Send completion signal
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));

          // Save session with assistant response
          turns.push({
            role: 'assistant',
            content: fullResponse,
            timestamp: Date.now()
          });

          await saveSession(caseId, sessionId, {
            mode,
            turns,
            opened: true
          });

          controller.close();
        } catch (error) {
          console.error('Stream error:', error);
          controller.error(error);
        }
      }
    });

    return new Response(readableStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no'
      }
    });

  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Failed to process chat' },
      { status: 500 }
    );
  }
}
