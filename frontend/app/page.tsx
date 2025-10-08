'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Mic, MessageSquare } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const startInterview = async () => {
    setLoading(true);

    // Generate session ID
    const sessionId = crypto.randomUUID();

    // Navigate to interview page
    router.push(`/interview/${sessionId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full">
        <CardContent className="p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              Ms. Esposito Standardized Patient Interview
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              RMD 561 - Clinical Reasoning Rounds
            </p>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
            <h2 className="font-semibold text-gray-900 dark:text-gray-200 mb-2">Case Overview</h2>
            <p className="text-sm text-gray-700 dark:text-gray-200">
              <strong>Patient:</strong> Ms. Esposito, 31-year-old female
            </p>
            <p className="text-sm text-gray-700 dark:text-gray-200 mt-2">
              <strong>Triage Note:</strong> Woke at 06:00 with fever (102.5°F) and chills.
              Fatigue × 3 days; right-sided abdominal/flank pain. Returned from
              Dominican Republic 2 days ago. History: ruptured ectopic pregnancy 2018.
              POC pregnancy test negative.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="border dark:border-gray-700 dark:bg-gray-800 rounded-lg p-4 text-center">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 text-blue-600 dark:text-blue-400" />
              <h3 className="font-semibold mb-1 dark:text-gray-100">Text Mode</h3>
              <p className="text-xs text-gray-600 dark:text-gray-300">Type your questions</p>
            </div>
            <div className="border dark:border-gray-700 dark:bg-gray-800 rounded-lg p-4 text-center">
              <Mic className="w-8 h-8 mx-auto mb-2 text-blue-600 dark:text-blue-400" />
              <h3 className="font-semibold mb-1 dark:text-gray-100">Voice Mode</h3>
              <p className="text-xs text-gray-600 dark:text-gray-300">Speak naturally</p>
            </div>
          </div>

          <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">📝 Before You Begin:</h3>
            <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
              <li>✓ Find a quiet space for 10-15 minutes</li>
              <li>✓ This is a practice session to build your skills</li>
              <li>✓ You&apos;ll receive immediate feedback on your performance</li>
              <li>✓ You can switch between typing and speaking anytime</li>
            </ul>
          </div>

          <div className="space-y-3">
            <Button
              onClick={startInterview}
              disabled={loading}
              className="w-full text-lg py-6"
              size="lg"
            >
              {loading ? '⏳ Preparing Your Interview...' : '🎯 Begin Patient Interview'}
            </Button>

            <p className="text-sm text-center text-gray-600 dark:text-gray-400 font-medium">
              Estimated time: 10-15 minutes • You&apos;ll be graded on Completeness & Empathy
            </p>
          </div>

          <div className="mt-6 pt-6 border-t dark:border-gray-700">
            <h3 className="font-semibold text-sm mb-2 dark:text-gray-100">Learning Objectives:</h3>
            <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
              <li>• Practice focused history taking with OPQRST framework</li>
              <li>• Develop differential diagnosis reasoning</li>
              <li>• Balance open-ended and closed questions (empathy)</li>
              <li>• Elicit key facts systematically (completeness)</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
