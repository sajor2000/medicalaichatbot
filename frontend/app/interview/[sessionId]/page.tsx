'use client';

import { useParams } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import { MessageSquare, Mic, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { VoiceClient } from '@/components/VoiceClient';
import { gradeConversation } from '@/lib/grading';

type Message = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

type Mode = 'text' | 'voice';

export default function InterviewPage() {
  const params = useParams();
  const sessionId = params.sessionId as string;

  const [mode, setMode] = useState<Mode>('text');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [completeness, setCompleteness] = useState(0);
  const [empathy, setEmpathy] = useState(0);
  const [elicitedFactIds, setElicitedFactIds] = useState<string[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });

  useEffect(scrollToBottom, [messages]);

  // Update grading whenever messages change
  useEffect(() => {
    if (messages.length > 3) {
      const grading = gradeConversation(messages);
      setCompleteness(grading.completeness);
      setEmpathy(grading.empathy);
      setElicitedFactIds(grading.factsElicited.filter((f) => f.matched).map((f) => f.id));
    }
  }, [messages]);

  // Initialize session with narrator + first patient greeting
  useEffect(() => {
    const initMessages: Message[] = [
      {
        role: 'system',
        content:
          "You are a medical student preparing to see the next patient in the ED, Ms. Esposito. Here's the triage note: Ms. Esposito, 31F, woke up at 0600 with 'fever and chills.' She also feels fatigued and has some right-sided abdominal pain. She returned last week from a vacation in the Dominican Republic. PMH includes ectopic pregnancy (5 years ago). POC pregnancy test is negative. No one has yet taken a full history.",
      },
      {
        role: 'system',
        content: 'Your patient is sitting in the clinic room awaiting your arrival. Start the visit.',
      },
      {
        role: 'assistant',
        content: 'Hi, my name is Ms Esposito. I am here for my clinical visit. I hope you can help me!',
      },
    ];
    setMessages(initMessages);
  }, []);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: input.trim() };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caseId: 'RMD561_Esposito',
          sessionId,
          userText: input.trim(),
        }),
      });

      if (!res.ok) throw new Error('Failed to get response');

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = '';

      setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);

      while (true) {
        const { done, value } = await reader!.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices[0]?.delta?.content || '';
              assistantMessage += content;

              setMessages((prev) => {
                const updated = [...prev];
                updated[updated.length - 1].content = assistantMessage;
                return updated;
              });
            } catch {
              // Skip malformed JSON
            }
          }
        }
      }
    } catch (error) {
      console.error('Error:', error);
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Sorry, something went wrong. Please try again.' },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Ms. Esposito Interview</h1>
            <p className="text-sm text-gray-600">Session: {sessionId.slice(0, 8)}...</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
              <Button
                variant={mode === 'text' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setMode('text')}
                className="gap-2"
              >
                <MessageSquare className="w-4 h-4" />
                Text
              </Button>
              <Button
                variant={mode === 'voice' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setMode('voice')}
                className="gap-2"
              >
                <Mic className="w-4 h-4" />
                Voice
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 max-w-4xl w-full mx-auto p-4 flex gap-4">
        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          <Card className="flex-1 flex flex-col overflow-hidden">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg, idx) => {
                if (msg.role === 'system') {
                  return (
                    <div key={idx} className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-gray-700">
                      <strong className="text-blue-900">Narrator:</strong> {msg.content}
                    </div>
                  );
                }

                return (
                  <div
                    key={idx}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg p-3 ${
                        msg.role === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      <div className="text-xs font-semibold mb-1">
                        {msg.role === 'user' ? 'You' : 'Ms. Esposito'}
                      </div>
                      <div className="text-sm whitespace-pre-wrap">{msg.content}</div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            {mode === 'text' ? (
              <div className="border-t border-gray-200 p-4">
                <div className="flex gap-2">
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask your question..."
                    disabled={isLoading}
                    className="flex-1"
                  />
                  <Button onClick={sendMessage} disabled={isLoading || !input.trim()}>
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="border-t border-gray-200 p-4">
                <VoiceClient
                  sessionId={sessionId}
                  onTranscript={(text, role) => {
                    setMessages((prev) => [...prev, { role, content: text }]);
                  }}
                />
              </div>
            )}
          </Card>
        </div>

        {/* Sidebar - Facts Tracker */}
        <div className="w-72">
          <Card className="p-4">
            <h3 className="font-semibold text-gray-900 mb-3">Key Facts to Elicit</h3>
            <div className="space-y-2">
              {[
                { id: 'dysuria', label: 'Dysuria (burning with urination)' },
                { id: 'flank_pain_location', label: 'Flank pain location/radiation' },
                { id: 'pain_quality', label: 'Pain quality (crampy/sharp)' },
                { id: 'pain_severity', label: 'Pain severity (7/10)' },
                { id: 'fever_chills', label: 'Fever and chills' },
                { id: 'onset_timing', label: 'Onset timing (3 days)' },
                { id: 'travel_history', label: 'Travel history (DR)' },
                { id: 'allergies', label: 'Penicillin allergy' },
                { id: 'sexual_history', label: 'Sexual history' },
                { id: 'lmp', label: 'Last menstrual period' },
                { id: 'pmh', label: 'PMH (PCOS, ectopic)' },
              ].map((fact, idx) => (
                <div key={fact.id} className="flex items-center gap-2">
                  <Badge variant={elicitedFactIds.includes(fact.id) ? 'default' : 'outline'}>
                    {elicitedFactIds.includes(fact.id) ? '✓' : idx + 1}
                  </Badge>
                  <span className="text-sm text-gray-700">{fact.label}</span>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t">
              <div className="text-sm text-gray-600">
                <div className="flex justify-between mb-1">
                  <span>Completeness:</span>
                  <span className="font-semibold">{completeness > 0 ? `${completeness}/5` : '-'}</span>
                </div>
                <div className="flex justify-between mb-1">
                  <span>Empathy:</span>
                  <span className="font-semibold">{empathy > 0 ? `${empathy}/5` : '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Facts:</span>
                  <span className="font-semibold">{elicitedFactIds.length}/11</span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
