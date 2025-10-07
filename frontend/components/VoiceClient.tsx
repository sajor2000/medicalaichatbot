'use client';

import { useEffect, useRef, useState } from 'react';
import { Mic, MicOff, Volume2, VolumeX, Loader2, AlertCircle } from 'lucide-react';
import { Button } from './ui/button';
import * as SpeechSDK from 'microsoft-cognitiveservices-speech-sdk';

interface VoiceClientProps {
  sessionId: string;
  onTranscript?: (text: string, role: 'user' | 'assistant') => void;
}

type VoiceStatus = 'disconnected' | 'listening' | 'processing' | 'speaking' | 'error';

export function VoiceClient({ sessionId, onTranscript }: VoiceClientProps) {
  const [isListening, setIsListening] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [status, setStatus] = useState<VoiceStatus>('disconnected');
  const [statusMessage, setStatusMessage] = useState<string>('Click "Start Voice Mode" to begin');
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentTranscript, setCurrentTranscript] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const recognizerRef = useRef<SpeechSDK.SpeechRecognizer | null>(null);
  const synthesizerRef = useRef<SpeechSDK.SpeechSynthesizer | null>(null);

  useEffect(() => {
    return () => {
      stopListening();
    };
  }, []);

  const startListening = async () => {
    try {
      setStatus('listening');
      setStatusMessage('Initializing voice mode...');
      setErrorMessage('');
      setCurrentTranscript('');

      const speechKey = process.env.NEXT_PUBLIC_AZURE_SPEECH_KEY!;
      const speechRegion = process.env.NEXT_PUBLIC_AZURE_SPEECH_REGION!;

      // Debug logging for environment variables
      console.log('[VoiceClient] Environment variables check:');
      console.log('[VoiceClient] NEXT_PUBLIC_AZURE_SPEECH_KEY:', speechKey ? 'SET (length: ' + speechKey.length + ')' : 'UNDEFINED');
      console.log('[VoiceClient] NEXT_PUBLIC_AZURE_SPEECH_REGION:', speechRegion ? speechRegion : 'UNDEFINED');

      if (!speechKey || !speechRegion) {
        const errorMsg = 'Microphone access is required for voice mode. Please check your browser permissions and environment configuration.';
        console.error('[VoiceClient]', errorMsg);
        setStatus('error');
        setStatusMessage('Configuration Error');
        setErrorMessage(errorMsg);
        return;
      }

      // Configure Speech SDK
      const speechConfig = SpeechSDK.SpeechConfig.fromSubscription(speechKey, speechRegion);
      speechConfig.speechRecognitionLanguage = 'en-US';
      speechConfig.speechSynthesisVoiceName = 'en-US-AriaNeural'; // Warm female voice

      // Setup audio config for recognition
      const audioConfig = SpeechSDK.AudioConfig.fromDefaultMicrophoneInput();
      const recognizer = new SpeechSDK.SpeechRecognizer(speechConfig, audioConfig);
      recognizerRef.current = recognizer;

      // Setup synthesizer for text-to-speech
      const synthesizer = new SpeechSDK.SpeechSynthesizer(speechConfig);
      synthesizerRef.current = synthesizer;

      // Handle recognized speech
      recognizer.recognized = async (s, e) => {
        if (e.result.reason === SpeechSDK.ResultReason.RecognizedSpeech) {
          const userText = e.result.text;
          console.log('[Speech Recognition]', userText);

          setCurrentTranscript(userText);

          // Send to parent component
          onTranscript?.(userText, 'user');

          // Send to GPT-4o and get response
          await getAIResponse(userText);
        }
      };

      // Handle errors
      recognizer.canceled = (s, e) => {
        console.error('[Speech Recognition Error]', e.errorDetails);
        setStatus('error');
        setStatusMessage('Recognition Error');
        setErrorMessage(`Speech recognition failed: ${e.errorDetails}. Please try again or check your microphone permissions.`);
      };

      // Start continuous recognition
      recognizer.startContinuousRecognitionAsync(
        () => {
          setIsListening(true);
          setStatus('listening');
          setStatusMessage('Listening to your voice...');
          console.log('[Speech] Listening started');
        },
        (error) => {
          console.error('[Speech] Start error:', error);
          setStatus('error');
          setStatusMessage('Failed to Start');
          setErrorMessage('Could not start voice recognition. Please check your microphone permissions and try again.');
        }
      );

    } catch (error) {
      console.error('Failed to start voice:', error);
      setStatus('error');
      setStatusMessage('Failed to Start');
      setErrorMessage(error instanceof Error ? error.message : 'An unexpected error occurred');
    }
  };

  const getAIResponse = async (userText: string) => {
    try {
      setIsProcessing(true);
      setStatus('processing');
      setStatusMessage('AI is thinking...');

      // Call chat API to get response from GPT-4o
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          message: userText,
          stream: false, // Don't stream for voice
        }),
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const aiText = data.response;

      console.log('[AI Response]', aiText);

      // Send to parent component
      onTranscript?.(aiText, 'assistant');

      // Speak the response
      await speakText(aiText);

    } catch (error) {
      console.error('Failed to get AI response:', error);
      setStatus('error');
      setStatusMessage('AI Response Failed');
      setErrorMessage(error instanceof Error ? error.message : 'Failed to get AI response. Please try again.');
    } finally {
      setIsProcessing(false);
      if (status !== 'error') {
        setStatus('listening');
        setStatusMessage('Listening to your voice...');
      }
    }
  };

  const speakText = async (text: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (!synthesizerRef.current) {
        reject(new Error('Synthesizer not initialized'));
        return;
      }

      if (!isSpeakerOn) {
        resolve();
        return;
      }

      setStatus('speaking');
      setStatusMessage('Ms. Esposito is speaking...');

      synthesizerRef.current.speakTextAsync(
        text,
        (result) => {
          if (result.reason === SpeechSDK.ResultReason.SynthesizingAudioCompleted) {
            console.log('[Speech Synthesis] Audio completed');
            setStatus('listening');
            setStatusMessage('Listening to your voice...');
            resolve();
          } else {
            console.error('[Speech Synthesis] Error:', result.errorDetails);
            setStatus('error');
            setStatusMessage('Speech Synthesis Error');
            setErrorMessage(`Failed to speak response: ${result.errorDetails}`);
            reject(new Error(result.errorDetails));
          }
        },
        (error) => {
          console.error('[Speech Synthesis] Failed:', error);
          setStatus('error');
          setStatusMessage('Speech Synthesis Error');
          setErrorMessage('Failed to speak response. Please check your audio settings.');
          reject(error);
        }
      );
    });
  };

  const stopListening = () => {
    if (recognizerRef.current) {
      recognizerRef.current.stopContinuousRecognitionAsync(
        () => {
          console.log('[Speech] Recognition stopped');
          recognizerRef.current?.close();
          recognizerRef.current = null;
        },
        (error) => {
          console.error('[Speech] Stop error:', error);
        }
      );
    }

    if (synthesizerRef.current) {
      synthesizerRef.current.close();
      synthesizerRef.current = null;
    }

    setIsListening(false);
    setStatus('disconnected');
    setStatusMessage('Voice session ended');
    setCurrentTranscript('');
    setErrorMessage('');
  };

  const toggleMute = () => {
    // Muting stops sending audio to recognition
    if (recognizerRef.current) {
      if (isMuted) {
        // Resume recognition
        recognizerRef.current.startContinuousRecognitionAsync();
        setStatus('listening');
        setStatusMessage('Listening to your voice...');
      } else {
        // Pause recognition
        recognizerRef.current.stopContinuousRecognitionAsync();
        setStatus('listening');
        setStatusMessage('Microphone muted');
      }
      setIsMuted(!isMuted);
    }
  };

  const toggleSpeaker = () => {
    setIsSpeakerOn(!isSpeakerOn);
  };

  // Get status indicator color based on current status
  const getStatusColor = () => {
    switch (status) {
      case 'listening':
        return 'bg-green-500';
      case 'processing':
        return 'bg-blue-500';
      case 'speaking':
        return 'bg-purple-500';
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-gray-400';
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 p-4 sm:p-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border border-gray-200 shadow-sm">
      {/* Status Indicator - Large and Prominent */}
      <div className="flex flex-col items-center gap-3 w-full">
        <div className="flex items-center gap-3">
          <div className={`w-4 h-4 rounded-full ${getStatusColor()} ${status !== 'disconnected' ? 'animate-pulse' : ''} shadow-lg`} />
          <div className="text-base sm:text-lg font-semibold text-gray-900">
            {statusMessage}
          </div>
          {isProcessing && status !== 'error' && (
            <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
          )}
        </div>

        {/* Current Transcript Display */}
        {currentTranscript && (
          <div className="w-full bg-white rounded-lg p-3 border border-blue-200 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-300">
            <p className="text-sm text-gray-600 font-medium mb-1">You said:</p>
            <p className="text-base text-gray-900 italic">&ldquo;{currentTranscript}&rdquo;</p>
          </div>
        )}

        {/* Error Message Display */}
        {errorMessage && (
          <div className="w-full bg-red-50 rounded-lg p-3 border border-red-200 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-red-900 mb-1">Error</p>
                <p className="text-sm text-red-700">{errorMessage}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Control Buttons */}
      <div className="flex flex-wrap gap-2 justify-center">
        {!isListening ? (
          <Button
            onClick={startListening}
            size="lg"
            className="gap-2 min-w-[180px] min-h-[48px] text-base shadow-md hover:shadow-lg transition-all"
            aria-label="Start voice mode"
          >
            <Mic className="w-5 h-5" />
            Start Voice Mode
          </Button>
        ) : (
          <>
            <Button
              onClick={stopListening}
              variant="destructive"
              size="lg"
              className="gap-2 min-h-[48px] shadow-md hover:shadow-lg transition-all"
              aria-label="End voice session"
            >
              <MicOff className="w-5 h-5" />
              <span className="hidden sm:inline">End Session</span>
            </Button>

            <Button
              onClick={toggleMute}
              variant={isMuted ? 'destructive' : 'outline'}
              size="lg"
              className="gap-2 min-h-[48px] shadow-sm hover:shadow-md transition-all"
              aria-label={isMuted ? 'Unmute microphone' : 'Mute microphone'}
            >
              {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              <span className="hidden sm:inline">{isMuted ? 'Unmute' : 'Mute'}</span>
            </Button>

            <Button
              onClick={toggleSpeaker}
              variant={!isSpeakerOn ? 'destructive' : 'outline'}
              size="lg"
              className="gap-2 min-h-[48px] shadow-sm hover:shadow-md transition-all"
              aria-label={isSpeakerOn ? 'Turn speaker off' : 'Turn speaker on'}
            >
              {isSpeakerOn ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
              <span className="hidden sm:inline">{isSpeakerOn ? 'Speaker On' : 'Speaker Off'}</span>
            </Button>
          </>
        )}
      </div>

      {/* Help Text */}
      <div className="text-xs sm:text-sm text-gray-600 text-center max-w-md leading-relaxed">
        {isListening ? (
          <>
            <span className="font-medium">Speak naturally with Ms. Esposito.</span>
            <br />
            The AI will respond after you finish speaking.
          </>
        ) : (
          <>
            <span className="font-medium">Ready to start a voice conversation?</span>
            <br />
            Make sure your microphone is enabled and click the button above.
          </>
        )}
      </div>
    </div>
  );
}
