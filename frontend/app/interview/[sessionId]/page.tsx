'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import { MessageSquare, Mic, Send, Loader2, AlertCircle, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { VoiceClient } from '@/components/VoiceClient';

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
  const router = useRouter();
  const sessionId = params.sessionId as string;

  const [mode, setMode] = useState<Mode>('text');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<ErrorState>(null);
  const [showEndDialog, setShowEndDialog] = useState(false);

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

  const handleEndInterview = () => {
    setShowEndDialog(true);
  };

  const confirmEndInterview = () => {
    // Save session data to localStorage for summary page
    const sessionKey = `session_default_${sessionId}`;
    const turns = messages.map(msg => ({
      role: msg.role,
      content: msg.content,
      timestamp: Date.now()
    }));
    localStorage.setItem(sessionKey, JSON.stringify({ turns, mode, opened: true }));

    // Navigate to summary page
    router.push(`/interview/${sessionId}/summary`);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex-shrink-0">
              <h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100">Ms. Esposito Interview</h1>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Session: {sessionId.slice(0, 8)}...</p>
            </div>

            <div className="flex items-center gap-3">
              {/* MODE SWITCHER */}
              <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 rounded-lg p-1.5">
                <Button
                  variant={mode === 'text' ? 'default' : 'ghost'}
                  size="lg"
                  onClick={() => setMode('text')}
                  className="gap-2 min-h-[48px] px-4 font-semibold"
                  aria-label="Switch to text mode"
                >
                  <MessageSquare className="w-5 h-5" />
                  TEXT
                </Button>
                <Button
                  variant={mode === 'voice' ? 'default' : 'outline'}
                  size="lg"
                  onClick={() => setMode('voice')}
                  className={`gap-2 min-h-[48px] px-4 font-semibold transition-all ${
                    mode === 'voice'
                      ? 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white border-0'
                      : 'text-gray-700 border-gray-300 hover:bg-blue-50 hover:border-blue-300'
                  }`}
                  aria-label="Switch to voice mode"
                >
                  <Mic className="w-5 h-5" />
                  🎤 VOICE
                </Button>
              </div>

              {/* END INTERVIEW BUTTON */}
              <Button
                variant="destructive"
                size="lg"
                onClick={handleEndInterview}
                className="gap-2 min-h-[48px]"
                aria-label="End interview and see summary"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">End Interview</span>
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
                    className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3 text-sm text-gray-700 dark:text-gray-300 animate-in fade-in duration-300"
                    role="status"
                    aria-live="polite"
                  >
                    <strong className="text-blue-900 dark:text-blue-300">Narrator:</strong> {msg.content}
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
                        ? 'bg-blue-600 dark:bg-blue-500 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
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
            <div className="border-t border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/30 p-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex items-start gap-2 text-sm">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold text-red-900 dark:text-red-200">Failed to send message</p>
                  <p className="text-red-700 dark:text-red-300 mt-1">{error.message}</p>
                  {error.userMessage && (
                    <p className="text-red-600 dark:text-red-400 mt-2 italic">Your message: &ldquo;{error.userMessage}&rdquo;</p>
                  )}
                  <Button
                    onClick={retryLastMessage}
                    variant="outline"
                    size="sm"
                    className="mt-2 border-red-300 dark:border-red-700 text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/50"
                  >
                    Retry Message
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Input Area */}
          {mode === 'text' ? (
            <div className="border-t border-gray-200 dark:border-gray-700 p-3 sm:p-4 bg-white dark:bg-gray-800">
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
              <div className="mt-2 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>Press Enter to send</span>
                <span>{input.length}/500</span>
              </div>
            </div>
          ) : (
            <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-800">
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

      {/* End Interview Confirmation Dialog */}
      {showEndDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full p-6 bg-white dark:bg-gray-800">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3">End Interview?</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Are you sure you want to end this interview? You&apos;ll be taken to a summary page to review your performance.
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowEndDialog(false)}
                className="flex-1"
              >
                Continue Interview
              </Button>
              <Button
                variant="destructive"
                onClick={confirmEndInterview}
                className="flex-1"
              >
                End & See Summary
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
