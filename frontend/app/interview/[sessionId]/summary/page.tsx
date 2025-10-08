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
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 dark:border-blue-400 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading summary...</p>
        </div>
      </div>
    );
  }

  if (!grading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Card className="p-8 max-w-md text-center">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">No Interview Data</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">Could not find interview data for this session.</p>
          <Button onClick={() => router.push('/')}>
            Return Home
          </Button>
        </Card>
      </div>
    );
  }

  const getScoreColor = (score: number, max: number) => {
    const percent = (score / max) * 100;
    if (percent >= 80) return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800';
    if (percent >= 60) return 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-800';
    return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800';
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Interview Summary</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">Ms. Esposito • Session: {sessionId.slice(0, 8)}...</p>
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

          <Card className="p-6 border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <div className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">Interview Stats</div>
            <div className="text-sm text-gray-700 dark:text-gray-300">
              <div>Duration: {duration}</div>
              <div>Questions: {questionCount}</div>
              <div>Open: {grading.openEndedQuestions}</div>
              <div>Closed: {grading.closedQuestions}</div>
            </div>
          </Card>
        </div>

        {/* Why You Got This Score - Personalized Explanation */}
        <Card className="p-6 mb-8 bg-purple-50 dark:bg-purple-900/30 border-purple-200 dark:border-purple-800">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">💡 Why You Got This Score</h2>

          {/* Completeness Explanation */}
          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Completeness: {grading.completeness}/5
            </h3>
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
              You elicited <strong>{grading.elicitedCount} of {grading.totalFacts} facts ({Math.round((grading.elicitedCount / grading.totalFacts) * 100)}%)</strong>.
              {' '}
              {(() => {
                const percent = (grading.elicitedCount / grading.totalFacts) * 100;
                if (percent >= 90) return 'This falls in the 90%+ range (Excellent - 5/5). Outstanding completeness!';
                if (percent >= 75) return 'This falls in the 75-89% range (Very Good - 4/5). You gathered most key information.';
                if (percent >= 60) return 'This falls in the 60-74% range (Good - 3/5). Solid foundation with room to improve.';
                if (percent >= 40) return 'This falls in the 40-59% range (Needs Improvement - 2/5). Focus on systematic history-taking.';
                return 'This falls below 40% (Poor - 1/5). Review OPQRST framework for comprehensive histories.';
              })()}
            </p>

            {/* Progress Bar */}
            <div className="relative w-full h-8 bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden">
              <div
                className="absolute h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all"
                style={{ width: `${Math.min((grading.elicitedCount / grading.totalFacts) * 100, 100)}%` }}
              />
              <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-gray-900 dark:text-gray-100">
                {grading.elicitedCount}/{grading.totalFacts} facts ({Math.round((grading.elicitedCount / grading.totalFacts) * 100)}%)
              </div>
              {/* Threshold markers */}
              <div className="absolute top-0 left-[40%] w-px h-full bg-gray-400 dark:bg-gray-500" title="40% threshold" />
              <div className="absolute top-0 left-[60%] w-px h-full bg-gray-400 dark:bg-gray-500" title="60% threshold" />
              <div className="absolute top-0 left-[75%] w-px h-full bg-gray-400 dark:bg-gray-500" title="75% threshold" />
              <div className="absolute top-0 left-[90%] w-px h-full bg-gray-400 dark:bg-gray-500" title="90% threshold" />
            </div>

            {(() => {
              const percent = (grading.elicitedCount / grading.totalFacts) * 100;
              if (percent >= 75 && percent < 90) {
                const needed = Math.ceil(grading.totalFacts * 0.9) - grading.elicitedCount;
                return (
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-2 italic">
                    💪 Just {needed} more {needed === 1 ? 'fact' : 'facts'} would have earned you 5/5!
                  </p>
                );
              }
              if (percent >= 60 && percent < 75) {
                const needed = Math.ceil(grading.totalFacts * 0.75) - grading.elicitedCount;
                return (
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-2 italic">
                    💪 Just {needed} more {needed === 1 ? 'fact' : 'facts'} would have earned you 4/5!
                  </p>
                );
              }
              return null;
            })()}
          </div>

          {/* Empathy Explanation */}
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Empathy: {grading.empathy}/5
            </h3>
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
              You asked <strong>{grading.openEndedQuestions} open-ended questions out of {grading.openEndedQuestions + grading.closedQuestions} total ({grading.openEndedQuestions + grading.closedQuestions > 0 ? Math.round((grading.openEndedQuestions / (grading.openEndedQuestions + grading.closedQuestions)) * 100) : 0}%)</strong>.
              {' '}
              {(() => {
                const total = grading.openEndedQuestions + grading.closedQuestions;
                const ratio = total > 0 ? grading.openEndedQuestions / total : 0;
                if (ratio >= 0.4) return 'This falls in the 40%+ range (Excellent - 5/5). Excellent rapport-building!';
                if (ratio >= 0.3) return 'This falls in the 30-39% range (Very Good - 4/5). Strong empathy skills.';
                if (ratio >= 0.2) return 'This falls in the 20-29% range (Good - 3/5). Good balance with room to improve.';
                if (ratio >= 0.1) return 'This falls in the 10-19% range (Needs Improvement - 2/5). Try more open-ended questions.';
                return 'This falls below 10% (Poor - 1/5). Focus on patient-centered open-ended questions.';
              })()}
            </p>

            {/* Progress Bar */}
            <div className="relative w-full h-8 bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden">
              <div
                className="absolute h-full bg-gradient-to-r from-green-500 to-blue-500 transition-all"
                style={{
                  width: `${grading.openEndedQuestions + grading.closedQuestions > 0
                    ? Math.min((grading.openEndedQuestions / (grading.openEndedQuestions + grading.closedQuestions)) * 100, 100)
                    : 0}%`
                }}
              />
              <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-gray-900 dark:text-gray-100">
                {grading.openEndedQuestions}/{grading.openEndedQuestions + grading.closedQuestions} open-ended ({grading.openEndedQuestions + grading.closedQuestions > 0 ? Math.round((grading.openEndedQuestions / (grading.openEndedQuestions + grading.closedQuestions)) * 100) : 0}%)
              </div>
              {/* Threshold markers */}
              <div className="absolute top-0 left-[10%] w-px h-full bg-gray-400 dark:bg-gray-500" title="10% threshold" />
              <div className="absolute top-0 left-[20%] w-px h-full bg-gray-400 dark:bg-gray-500" title="20% threshold" />
              <div className="absolute top-0 left-[30%] w-px h-full bg-gray-400 dark:bg-gray-500" title="30% threshold" />
              <div className="absolute top-0 left-[40%] w-px h-full bg-gray-400 dark:bg-gray-500" title="40% threshold" />
            </div>

            {(() => {
              const total = grading.openEndedQuestions + grading.closedQuestions;
              const ratio = total > 0 ? grading.openEndedQuestions / total : 0;
              if (ratio >= 0.3 && ratio < 0.4) {
                const needed = Math.ceil(total * 0.4) - grading.openEndedQuestions;
                return (
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-2 italic">
                    💪 Just {needed} more open-ended {needed === 1 ? 'question' : 'questions'} would have earned you 5/5!
                  </p>
                );
              }
              if (ratio >= 0.2 && ratio < 0.3) {
                const needed = Math.ceil(total * 0.3) - grading.openEndedQuestions;
                return (
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-2 italic">
                    💪 Just {needed} more open-ended {needed === 1 ? 'question' : 'questions'} would have earned you 4/5!
                  </p>
                );
              }
              return null;
            })()}
          </div>
        </Card>

        {/* Grading Rubric */}
        <Card className="p-6 mb-8 bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">📊 Grading Rubric</h2>
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Completeness Score (1-5)</h3>
              <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                Based on percentage of key facts elicited from the patient:
              </p>
              <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1 ml-4">
                <li>• <strong>5/5:</strong> 90%+ of facts elicited (Excellent)</li>
                <li>• <strong>4/5:</strong> 75-89% of facts elicited (Very Good)</li>
                <li>• <strong>3/5:</strong> 60-74% of facts elicited (Good)</li>
                <li>• <strong>2/5:</strong> 40-59% of facts elicited (Needs Improvement)</li>
                <li>• <strong>1/5:</strong> Below 40% of facts elicited (Poor)</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Empathy Score (1-5)</h3>
              <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                Based on ratio of open-ended questions to total questions:
              </p>
              <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1 ml-4">
                <li>• <strong>5/5:</strong> 40%+ open-ended questions (Excellent rapport building)</li>
                <li>• <strong>4/5:</strong> 30-39% open-ended questions (Very Good)</li>
                <li>• <strong>3/5:</strong> 20-29% open-ended questions (Good)</li>
                <li>• <strong>2/5:</strong> 10-19% open-ended questions (Needs Improvement)</li>
                <li>• <strong>1/5:</strong> Below 10% open-ended questions (Poor)</li>
              </ul>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-3 italic">
                Open-ended questions start with &quot;What brings you...&quot;, &quot;Tell me about...&quot;, &quot;How are you...&quot;, &quot;Describe...&quot;, etc.
              </p>
            </div>
          </div>
        </Card>

        {/* Facts Elicited */}
        <Card className="p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Facts Elicited ({grading.elicitedCount}/{grading.totalFacts})
          </h2>
          <div className="space-y-2">
            {grading.factsElicited.map((fact) => (
              <div
                key={fact.id}
                className={`flex items-start gap-3 p-3 rounded-lg ${
                  fact.matched ? 'bg-green-50 dark:bg-green-900/30' : 'bg-red-50 dark:bg-red-900/30'
                }`}
              >
                {fact.matched ? (
                  <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <div className={`font-medium ${fact.matched ? 'text-green-900 dark:text-gray-100' : 'text-red-900 dark:text-gray-100'}`}>
                    {fact.description}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
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
          <Card className="p-6 mb-8 bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800">
            <h3 className="font-bold text-green-900 dark:text-green-400 mb-2">Excellent Work!</h3>
            <p className="text-green-800 dark:text-gray-200">
              You gathered a thorough history and asked thoughtful questions. Your use of open-ended questions
              demonstrated good empathy and rapport-building.
            </p>
          </Card>
        )}

        {grading.completeness < 4 && grading.missedFacts.length > 0 && (
          <Card className="p-6 mb-8 bg-yellow-50 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-800">
            <h3 className="font-bold text-yellow-900 dark:text-yellow-400 mb-2">Key Facts Missed</h3>
            <p className="text-yellow-800 dark:text-gray-200 mb-3">
              Consider asking about these important details in future interviews:
            </p>
            <ul className="space-y-1">
              {grading.missedFacts.map((fact, idx) => (
                <li key={idx} className="text-yellow-900 dark:text-gray-100 text-sm">• {fact}</li>
              ))}
            </ul>
          </Card>
        )}

        {/* Actions */}
        <Card className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/30 dark:to-purple-900/30 border-blue-200 dark:border-blue-800">
          <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100 mb-4 text-center">
            🎯 What Would You Like to Do Next?
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button
              onClick={() => router.push('/')}
              className="py-6 text-base font-semibold"
              size="lg"
            >
              <RotateCcw className="w-5 h-5 mr-2" />
              🔄 Practice This Case Again
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push(`/interview/${sessionId}`)}
              className="py-6 text-base font-semibold"
              size="lg"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              📝 Review Full Conversation
            </Button>
          </div>
          <p className="text-sm text-center text-gray-600 dark:text-gray-400 mt-4">
            Tip: Reviewing your conversation helps you learn from your approach and improve your clinical reasoning skills.
          </p>
        </Card>
      </div>
    </div>
  );
}
