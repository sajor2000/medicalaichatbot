'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { gradeConversation, type GradingResult } from '@/lib/grading';
import { CheckCircle2, XCircle, ArrowLeft, RotateCcw } from 'lucide-react';

interface Turn {
  role: string;
  content: string;
  timestamp: number;
}

export default function InterviewSummaryPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;

  const [grading, setGrading] = useState<GradingResult | null>(null);
  const [duration, setDuration] = useState<string>('');
  const [questionCount, setQuestionCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadGrading() {
      try {
        // Load session from localStorage (fallback) or API
        const sessionKey = `session_default_${sessionId}`;
        const sessionData = localStorage.getItem(sessionKey);

        if (!sessionData) {
          console.error('No session data found');
          setLoading(false);
          return;
        }

        const session = JSON.parse(sessionData);
        const turns: Turn[] = session.turns || [];

        // Calculate grading
        const messages = turns.map(t => ({ role: t.role, content: t.content }));
        const result = gradeConversation(messages);
        setGrading(result);

        // Calculate duration
        if (turns.length > 0) {
          const start = turns[0].timestamp;
          const end = turns[turns.length - 1].timestamp;
          const durationMs = end - start;
          const minutes = Math.floor(durationMs / 60000);
          const seconds = Math.floor((durationMs % 60000) / 1000);
          setDuration(`${minutes}m ${seconds}s`);
        }

        // Count questions
        const userTurns = turns.filter(t => t.role === 'user');
        setQuestionCount(userTurns.length);

      } catch (error) {
        console.error('Error loading grading:', error);
      } finally {
        setLoading(false);
      }
    }

    loadGrading();
  }, [sessionId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading summary...</p>
        </div>
      </div>
    );
  }

  if (!grading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-8 max-w-md text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-4">No Interview Data</h2>
          <p className="text-gray-600 mb-6">Could not find interview data for this session.</p>
          <Button onClick={() => router.push('/')}>
            Return Home
          </Button>
        </Card>
      </div>
    );
  }

  const getScoreColor = (score: number, max: number) => {
    const percent = (score / max) * 100;
    if (percent >= 80) return 'text-green-600 bg-green-50 border-green-200';
    if (percent >= 60) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.push(`/interview/${sessionId}`)}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Interview
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">Interview Summary</h1>
          <p className="text-gray-600 mt-2">Ms. Esposito • Session: {sessionId.slice(0, 8)}...</p>
        </div>

        {/* Score Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className={`p-6 border-2 ${getScoreColor(grading.completeness, 5)}`}>
            <div className="text-sm font-medium mb-2">Completeness</div>
            <div className="text-4xl font-bold">{grading.completeness}/5</div>
            <div className="text-xs mt-2 opacity-80">
              {grading.elicitedCount} of {grading.totalFacts} facts elicited
            </div>
          </Card>

          <Card className={`p-6 border-2 ${getScoreColor(grading.empathy, 5)}`}>
            <div className="text-sm font-medium mb-2">Empathy</div>
            <div className="text-4xl font-bold">{grading.empathy}/5</div>
            <div className="text-xs mt-2 opacity-80">
              {grading.openEndedQuestions} open-ended questions
            </div>
          </Card>

          <Card className="p-6 border-2 border-gray-200 bg-white">
            <div className="text-sm font-medium text-gray-600 mb-2">Interview Stats</div>
            <div className="text-sm text-gray-700">
              <div>Duration: {duration}</div>
              <div>Questions: {questionCount}</div>
              <div>Open: {grading.openEndedQuestions}</div>
              <div>Closed: {grading.closedQuestions}</div>
            </div>
          </Card>
        </div>

        {/* Facts Elicited */}
        <Card className="p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Facts Elicited ({grading.elicitedCount}/{grading.totalFacts})
          </h2>
          <div className="space-y-2">
            {grading.factsElicited.map((fact) => (
              <div
                key={fact.id}
                className={`flex items-start gap-3 p-3 rounded-lg ${
                  fact.matched ? 'bg-green-50' : 'bg-red-50'
                }`}
              >
                {fact.matched ? (
                  <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <div className={`font-medium ${fact.matched ? 'text-green-900' : 'text-red-900'}`}>
                    {fact.description}
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    <Badge variant="outline" className="text-xs">
                      {fact.category}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Feedback */}
        {grading.completeness >= 4 && (
          <Card className="p-6 mb-8 bg-green-50 border-green-200">
            <h3 className="font-bold text-green-900 mb-2">Excellent Work!</h3>
            <p className="text-green-800">
              You gathered a thorough history and asked thoughtful questions. Your use of open-ended questions
              demonstrated good empathy and rapport-building.
            </p>
          </Card>
        )}

        {grading.completeness < 4 && grading.missedFacts.length > 0 && (
          <Card className="p-6 mb-8 bg-yellow-50 border-yellow-200">
            <h3 className="font-bold text-yellow-900 mb-2">Key Facts Missed</h3>
            <p className="text-yellow-800 mb-3">
              Consider asking about these important details in future interviews:
            </p>
            <ul className="space-y-1">
              {grading.missedFacts.map((fact, idx) => (
                <li key={idx} className="text-yellow-900 text-sm">• {fact}</li>
              ))}
            </ul>
          </Card>
        )}

        {/* Actions */}
        <div className="flex gap-4">
          <Button
            onClick={() => router.push('/')}
            className="flex-1"
            size="lg"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Start New Interview
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push(`/interview/${sessionId}`)}
            className="flex-1"
            size="lg"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Review Conversation
          </Button>
        </div>
      </div>
    </div>
  );
}
