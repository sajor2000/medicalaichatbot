'use client';

import { useEffect, useRef, useState } from 'react';
import { Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
import { Button } from './ui/button';
import * as SpeechSDK from 'microsoft-cognitiveservices-speech-sdk';

interface VoiceClientProps {
  sessionId: string;
  onTranscript?: (text: string, role: 'user' | 'assistant') => void;
}

export function VoiceClient({ sessionId, onTranscript }: VoiceClientProps) {
  const [isListening, setIsListening] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [status, setStatus] = useState<string>('Disconnected');
  const [isProcessing, setIsProcessing] = useState(false);

  const recognizerRef = useRef<SpeechSDK.SpeechRecognizer | null>(null);
  const synthesizerRef = useRef<SpeechSDK.SpeechSynthesizer | null>(null);

  useEffect(() => {
    return () => {
      stopListening();
    };
  }, []);

  const startListening = async () => {
    try {
      setStatus('Starting...');

      const speechKey = process.env.NEXT_PUBLIC_AZURE_SPEECH_KEY!;
      const speechRegion = process.env.NEXT_PUBLIC_AZURE_SPEECH_REGION!;

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

          // Send to parent component
          onTranscript?.(userText, 'user');

          // Send to GPT-4o and get response
          await getAIResponse(userText);
        }
      };

      // Handle errors
      recognizer.canceled = (s, e) => {
        console.error('[Speech Recognition Error]', e.errorDetails);
        setStatus('Error: ' + e.errorDetails);
      };

      // Start continuous recognition
      recognizer.startContinuousRecognitionAsync(
        () => {
          setIsListening(true);
          setStatus('Listening...');
          console.log('[Speech] Listening started');
        },
        (error) => {
          console.error('[Speech] Start error:', error);
          setStatus('Failed to start');
        }
      );

    } catch (error) {
      console.error('Failed to start voice:', error);
      setStatus('Failed to start');
    }
  };

  const getAIResponse = async (userText: string) => {
    try {
      setIsProcessing(true);
      setStatus('AI is thinking...');

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

      if (!response.ok) throw new Error('Failed to get AI response');

      const data = await response.json();
      const aiText = data.response;

      console.log('[AI Response]', aiText);

      // Send to parent component
      onTranscript?.(aiText, 'assistant');

      // Speak the response
      await speakText(aiText);

    } catch (error) {
      console.error('Failed to get AI response:', error);
      setStatus('AI response failed');
    } finally {
      setIsProcessing(false);
      setStatus('Listening...');
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

      setStatus('AI is speaking...');

      synthesizerRef.current.speakTextAsync(
        text,
        (result) => {
          if (result.reason === SpeechSDK.ResultReason.SynthesizingAudioCompleted) {
            console.log('[Speech Synthesis] Audio completed');
            resolve();
          } else {
            console.error('[Speech Synthesis] Error:', result.errorDetails);
            reject(new Error(result.errorDetails));
          }
        },
        (error) => {
          console.error('[Speech Synthesis] Failed:', error);
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
    setStatus('Disconnected');
  };

  const toggleMute = () => {
    // Muting stops sending audio to recognition
    if (recognizerRef.current) {
      if (isMuted) {
        // Resume recognition
        recognizerRef.current.startContinuousRecognitionAsync();
        setStatus('Listening...');
      } else {
        // Pause recognition
        recognizerRef.current.stopContinuousRecognitionAsync();
        setStatus('Muted');
      }
      setIsMuted(!isMuted);
    }
  };

  const toggleSpeaker = () => {
    setIsSpeakerOn(!isSpeakerOn);
  };

  return (
    <div className="flex flex-col items-center gap-4 p-6 bg-gray-50 rounded-lg border">
      <div className="text-sm font-medium text-gray-700">
        {status}
        {isProcessing && (
          <span className="ml-2 inline-block w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
        )}
      </div>

      <div className="flex gap-2">
        {!isListening ? (
          <Button onClick={startListening} className="gap-2">
            <Mic className="w-4 h-4" />
            Start Voice Mode
          </Button>
        ) : (
          <>
            <Button onClick={stopListening} variant="destructive" className="gap-2">
              <MicOff className="w-4 h-4" />
              End Session
            </Button>

            <Button onClick={toggleMute} variant={isMuted ? 'destructive' : 'outline'} className="gap-2">
              {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              {isMuted ? 'Unmute' : 'Mute'}
            </Button>

            <Button onClick={toggleSpeaker} variant={!isSpeakerOn ? 'destructive' : 'outline'} className="gap-2">
              {isSpeakerOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              {isSpeakerOn ? 'Speaker On' : 'Speaker Off'}
            </Button>
          </>
        )}
      </div>

      <div className="text-xs text-gray-500 text-center max-w-md">
        {isListening
          ? 'Speak naturally with Ms. Esposito. The AI will respond after you finish speaking.'
          : 'Click to start voice conversation with the AI patient'}
      </div>
    </div>
  );
}
