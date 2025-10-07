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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full">
        <CardContent className="p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Ms. Esposito Standardized Patient Interview
            </h1>
            <p className="text-gray-600">
              RMD 561 - Clinical Reasoning Rounds
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h2 className="font-semibold text-gray-900 mb-2">Case Overview</h2>
            <p className="text-sm text-gray-700">
              <strong>Patient:</strong> Ms. Esposito, 31-year-old female
            </p>
            <p className="text-sm text-gray-700 mt-2">
              <strong>Triage Note:</strong> Woke at 06:00 with fever (102.5°F) and chills.
              Fatigue × 3 days; right-sided abdominal/flank pain. Returned from
              Dominican Republic 2 days ago. History: ruptured ectopic pregnancy 2018.
              POC pregnancy test negative.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="border rounded-lg p-4 text-center">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 text-blue-600" />
              <h3 className="font-semibold mb-1">Text Mode</h3>
              <p className="text-xs text-gray-600">Type your questions</p>
            </div>
            <div className="border rounded-lg p-4 text-center">
              <Mic className="w-8 h-8 mx-auto mb-2 text-blue-600" />
              <h3 className="font-semibold mb-1">Voice Mode</h3>
              <p className="text-xs text-gray-600">Speak naturally</p>
            </div>
          </div>

          <div className="space-y-3">
            <Button
              onClick={startInterview}
              disabled={loading}
              className="w-full"
              size="lg"
            >
              {loading ? 'Starting Interview...' : 'Start Interview'}
            </Button>

            <p className="text-xs text-center text-gray-500">
              You can toggle between text and voice mode during the interview
            </p>
          </div>

          <div className="mt-6 pt-6 border-t">
            <h3 className="font-semibold text-sm mb-2">Learning Objectives:</h3>
            <ul className="text-sm text-gray-600 space-y-1">
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
