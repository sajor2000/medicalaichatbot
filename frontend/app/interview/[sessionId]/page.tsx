'use client';

import { useParams } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import { MessageSquare, Mic, Send, Loader2, AlertCircle } from 'lucide-react';
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

type ErrorState = {
  message: string;
  userMessage?: string;
} | null;

export default function InterviewPage() {
  const params = useParams();
  const sessionId = params.sessionId as string;

  const [mode, setMode] = useState<Mode>('text');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<ErrorState>(null);
  const [completeness, setCompleteness] = useState(0);
  const [empathy, setEmpathy] = useState(0);
  const [elicitedFactIds, setElicitedFactIds] = useState<string[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });

  useEffect(scrollToBottom, [messages]);

  // Auto-focus input field on mount and when switching to text mode
  useEffect(() => {
    if (mode === 'text') {
      inputRef.current?.focus();
    }
  }, [mode]);

  // Update grading whenever messages change - show from the start
  useEffect(() => {
    const grading = gradeConversation(messages);
    setCompleteness(grading.completeness);
    setEmpathy(grading.empathy);
    setElicitedFactIds(grading.factsElicited.filter((f) => f.matched).map((f) => f.id));
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

    const userMessageContent = input.trim();
    const userMessage: Message = { role: 'user', content: userMessageContent };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caseId: 'RMD561_Esposito',
          sessionId,
          userText: userMessageContent,
        }),
      });

      if (!res.ok) {
        throw new Error(`Server returned ${res.status}: ${res.statusText}`);
      }

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

      // Remove the empty assistant message that was added
      setMessages((prev) => prev.filter((msg) => msg.content !== ''));

      // Set error state with the user's lost message
      setError({
        message: error instanceof Error ? error.message : 'Failed to send message',
        userMessage: userMessageContent,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const retryLastMessage = () => {
    if (error?.userMessage) {
      setInput(error.userMessage);
      setError(null);
      inputRef.current?.focus();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Helper function to get badge color based on score
  const getBadgeColor = (score: number, maxScore: number) => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 60) return 'bg-green-100 text-green-800 border-green-300';
    if (percentage >= 40) return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    return 'bg-gray-100 text-gray-600 border-gray-300';
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 sm:py-4">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex-shrink-0">
            <h1 className="text-lg sm:text-xl font-bold text-gray-900">Ms. Esposito Interview</h1>
            <p className="text-xs sm:text-sm text-gray-600">Session: {sessionId.slice(0, 8)}...</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-4 w-full sm:w-auto">
            {/* Grading Badges - Now shown from start */}
            <div className="flex items-center gap-2 flex-wrap">
              <Badge
                variant="outline"
                className={`gap-1 ${getBadgeColor(completeness, 5)}`}
              >
                <span className="text-xs">Completeness:</span>
                <span className="font-semibold">{completeness}/5</span>
              </Badge>
              <Badge
                variant="outline"
                className={`gap-1 ${getBadgeColor(empathy, 5)}`}
              >
                <span className="text-xs">Empathy:</span>
                <span className="font-semibold">{empathy}/5</span>
              </Badge>
              <Badge
                variant="outline"
                className={`gap-1 ${getBadgeColor(elicitedFactIds.length, 11)}`}
              >
                <span className="text-xs">Facts:</span>
                <span className="font-semibold">{elicitedFactIds.length}/11</span>
              </Badge>
            </div>
            <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
              <Button
                variant={mode === 'text' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setMode('text')}
                className="gap-1.5 min-h-[44px] sm:min-h-0"
                aria-label="Switch to text mode"
              >
                <MessageSquare className="w-4 h-4" />
                <span className="hidden sm:inline">Text</span>
              </Button>
              <Button
                variant={mode === 'voice' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setMode('voice')}
                className="gap-1.5 min-h-[44px] sm:min-h-0"
                aria-label="Switch to voice mode"
              >
                <Mic className="w-4 h-4" />
                <span className="hidden sm:inline">Voice</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 max-w-4xl w-full mx-auto p-4">
        {/* Chat Area - Full Width with fixed height */}
        <Card className="flex flex-col overflow-hidden" style={{ height: 'calc(100vh - 10rem)' }}>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, idx) => {
              if (msg.role === 'system') {
                return (
                  <div
                    key={idx}
                    className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-gray-700 animate-in fade-in duration-300"
                    role="status"
                    aria-live="polite"
                  >
                    <strong className="text-blue-900">Narrator:</strong> {msg.content}
                  </div>
                );
              }

              return (
                <div
                  key={idx}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}
                >
                  <div
                    className={`max-w-[85%] sm:max-w-[80%] rounded-lg p-3 shadow-sm ${
                      msg.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <div className="text-xs font-semibold mb-1 opacity-90">
                      {msg.role === 'user' ? 'You' : 'Ms. Esposito'}
                    </div>
                    <div className="text-sm sm:text-base whitespace-pre-wrap leading-relaxed">
                      {msg.content || (
                        <span className="flex items-center gap-2 text-gray-500">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Typing...
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            {/* Show typing indicator when loading */}
            {isLoading && messages[messages.length - 1]?.content && (
              <div className="flex justify-start animate-in fade-in duration-300">
                <div className="bg-gray-100 rounded-lg p-3 shadow-sm">
                  <div className="flex items-center gap-2 text-gray-500">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Ms. Esposito is typing...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Error Display */}
          {error && (
            <div className="border-t border-red-200 bg-red-50 p-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex items-start gap-2 text-sm">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold text-red-900">Failed to send message</p>
                  <p className="text-red-700 mt-1">{error.message}</p>
                  {error.userMessage && (
                    <p className="text-red-600 mt-2 italic">Your message: &ldquo;{error.userMessage}&rdquo;</p>
                  )}
                  <Button
                    onClick={retryLastMessage}
                    variant="outline"
                    size="sm"
                    className="mt-2 border-red-300 text-red-700 hover:bg-red-100"
                  >
                    Retry Message
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Input Area */}
          {mode === 'text' ? (
            <div className="border-t border-gray-200 p-3 sm:p-4 bg-white">
              <div className="flex gap-2">
                <Input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Ask your question..."
                  disabled={isLoading}
                  autoFocus
                  autoComplete="off"
                  maxLength={500}
                  aria-label="Type your question to Ms. Esposito"
                  className="flex-1 text-base min-h-[44px] focus:ring-2 focus:ring-blue-500 transition-shadow"
                />
                <Button
                  onClick={sendMessage}
                  disabled={isLoading || !input.trim()}
                  size="lg"
                  className="gap-2 min-w-[100px] min-h-[44px] transition-all"
                  aria-label={isLoading ? 'Sending message' : 'Send message'}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="hidden sm:inline">Sending...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Send</span>
                    </>
                  )}
                </Button>
              </div>
              <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                <span>Press Enter to send</span>
                <span>{input.length}/500</span>
              </div>
            </div>
          ) : (
            <div className="border-t border-gray-200 p-4 bg-white">
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
    </div>
  );
}
