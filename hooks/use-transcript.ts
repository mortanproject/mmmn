import { useEffect, useState } from 'react';
import { useLiveAPIContext } from '../contexts/LiveAPIContext';
import { StreamingLog } from '../lib/genai-live-client';

export type TranscriptItem = {
  id: string;
  source: 'user' | 'agent';
  text: string;
  date: Date;
};

export function useTranscript() {
  const { client } = useLiveAPIContext();
  const [transcript, setTranscript] = useState<TranscriptItem[]>([]);

  useEffect(() => {
    const onLog = (log: StreamingLog) => {
      // Very basic transcript construction from logs
      if (log.type === 'server.content') {
        const msg = log.message as any;
        const text = msg?.serverContent?.modelTurn?.parts?.map((p: any) => p.text).filter(Boolean).join(' ');
        if (text) {
          setTranscript(prev => [...prev, { id: Math.random().toString(36), source: 'agent', text, date: log.date }]);
        }
      } else if (log.type === 'client.send') {
        const text = Array.isArray(log.message) 
          ? log.message.map((p: any) => p.text).filter(Boolean).join(' ')
          : (log.message as any)?.text;
        
        if (text) {
          setTranscript(prev => [...prev, { id: Math.random().toString(36), source: 'user', text, date: log.date }]);
        }
      }
    };

    client.on('log', onLog);
    return () => {
      client.off('log', onLog);
    };
  }, [client]);

  return transcript;
}
