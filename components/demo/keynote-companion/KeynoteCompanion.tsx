/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { useEffect } from 'react';
import { Modality } from '@google/genai';

import BasicFace from '../basic-face/BasicFace';
import { useLiveAPIContext } from '../../../contexts/LiveAPIContext';
import { createSystemInstructions } from '@/lib/prompts';
import { useAgent, useUser, useUI } from '@/lib/state';

export default function KeynoteCompanion() {
  const { client, connected, setConfig } = useLiveAPIContext();
  const user = useUser();
  const { current } = useAgent();
  const { lang } = useUI();

  // Set the configuration for the Live API
  useEffect(() => {
    if (!lang) return;

    setConfig({
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: current.voice },
        },
      },
      systemInstruction: {
        parts: [
          {
            text: createSystemInstructions(current, user, lang),
          },
        ],
      },
      tools: [{ googleSearch: {} }],
    });
  }, [setConfig, user, current, lang]);

  // Initiate the session when the Live API connection is established
  // Instruct the model to send an initial greeting message
  useEffect(() => {
    const beginSession = async () => {
      if (!connected || !lang) return;

      const greeting =
        lang === 'tr'
          ? 'Kullanıcıyı selamla, kendini ve rolünü tanıt.'
          : 'Greet the user and introduce yourself and your role.';

      client.send(
        {
          text: greeting,
        },
        true,
      );
    };
    beginSession();
  }, [client, connected, lang]);

  return (
    <div className="keynote-companion">
      <BasicFace color={current.bodyColor} />
    </div>
  );
}
