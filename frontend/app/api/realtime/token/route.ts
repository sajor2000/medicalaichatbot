import { NextRequest, NextResponse } from 'next/server';
import { SYSTEM_PROMPT } from '@/lib/prompt';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  try {
    const { sessionId } = await req.json();

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Missing sessionId' },
        { status: 400 }
      );
    }

    // Create Realtime session
    const response = await fetch(
      `${process.env.AZURE_REALTIME_ENDPOINT}/openai/realtime?api-version=2024-10-01-preview&deployment=${process.env.AZURE_OPENAI_REALTIME_DEPLOYMENT}`,
      {
        method: 'POST',
        headers: {
          'api-key': process.env.AZURE_REALTIME_KEY!,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: process.env.AZURE_OPENAI_REALTIME_DEPLOYMENT,
          voice: 'alloy',
          instructions: SYSTEM_PROMPT,
          modalities: ['text', 'audio'],
          turn_detection: {
            type: 'server_vad',
            threshold: 0.5,
            prefix_padding_ms: 300,
            silence_duration_ms: 500
          },
          temperature: 0.7,
          max_response_output_tokens: 150
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Azure Realtime API error:', errorText);
      throw new Error(`Failed to create Realtime session: ${response.statusText}`);
    }

    const data = await response.json();

    return NextResponse.json({
      client_secret: data.client_secret?.value,
      expires_at: data.client_secret?.expires_at,
      session_id: data.id
    });

  } catch (error) {
    console.error('Realtime token error:', error);
    return NextResponse.json(
      { error: 'Failed to create voice session' },
      { status: 500 }
    );
  }
}
