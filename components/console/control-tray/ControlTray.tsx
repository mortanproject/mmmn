/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
/**
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import cn from 'classnames';

import { memo, ReactNode, useEffect, useRef, useState } from 'react';
import { AudioRecorder } from '../../../lib/audio-recorder';

import { useLiveAPIContext } from '../../../contexts/LiveAPIContext';
import { useUI } from '@/lib/state';
import { useTranscript } from '../../../hooks/use-transcript';
import { useScreenCapture } from '../../../hooks/use-screen-capture';

export type ControlTrayProps = {
  children?: ReactNode;
};

function ControlTray({ children }: ControlTrayProps) {
  const [audioRecorder] = useState(() => new AudioRecorder());
  const [muted, setMuted] = useState(false);
  const connectButtonRef = useRef<HTMLButtonElement>(null);

  const { showAgentEdit, showUserConfig } = useUI();
  const { client, connected, connect, disconnect } = useLiveAPIContext();
  const transcript = useTranscript();
  const { stream: screenStream, isCapturing, startCapture, stopCapture } = useScreenCapture();
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleExport = () => {
    if (transcript.length === 0) {
      alert("No transcript text available yet.");
      return;
    }
    const markdownContent = transcript
      .map((t) => `**${t.source === 'agent' ? 'AI' : 'User'}**: ${t.text}`)
      .join('\n\n');
    
    const blob = new Blob([markdownContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Interview_Export_${new Date().toISOString().slice(0,10)}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };


  // Stop the current agent if the user is editing the agent or user config
  useEffect(() => {
    if (showAgentEdit || showUserConfig) {
      if (connected) disconnect();
    }
  }, [showUserConfig, showAgentEdit, connected, disconnect]);

  useEffect(() => {
    if (!connected && connectButtonRef.current) {
      connectButtonRef.current.focus();
    }
  }, [connected]);

  useEffect(() => {
    const onData = (base64: string) => {
      client.sendRealtimeInput([
        {
          mimeType: 'audio/pcm;rate=16000',
          data: base64,
        },
      ]);
    };
    if (connected && !muted && audioRecorder) {
      audioRecorder
        .on('data', onData)
        .start()
        .catch((err: any) => {
          console.error("Audio recorder failed to start:", err);
          setMuted(true);
          if (err.name === 'NotAllowedError' || err.message?.includes('Permission denied')) {
            alert('Microphone permission was denied. Please check your system/browser settings to allow microphone access.');
          } else {
            alert('Could not access microphone: ' + err.message);
          }
        });
    } else {
      audioRecorder.stop();
    }
    return () => {
      audioRecorder.off('data', onData);
    };
  }, [connected, client, muted, audioRecorder]);

  useEffect(() => {
    if (screenStream && videoRef.current) {
      videoRef.current.srcObject = screenStream;
      videoRef.current.play().catch(console.error);
    }
  }, [screenStream]);

  useEffect(() => {
    let intervalId: number;
    if (connected && isCapturing && videoRef.current) {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      intervalId = window.setInterval(() => {
        if (video.videoWidth > 0 && video.videoHeight > 0) {
          // Keep a reasonable scale for API token limits
          canvas.width = 640;
          canvas.height = (640 / video.videoWidth) * video.videoHeight;
          ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.5);
          const base64 = dataUrl.split(',')[1];
          if (base64) {
            client.sendRealtimeInput([{
              mimeType: 'image/jpeg',
              data: base64
            }]);
          }
        }
      }, 2000); // Send 1 frame every 2 seconds
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [connected, isCapturing, client]);

  return (
    <section className="control-tray">
      <nav className={cn('actions-nav', { disabled: !connected })}>
        <button
          className={cn('action-button mic-button')}
          onClick={() => setMuted(!muted)}
        >
          {!muted ? (
            <span className="material-symbols-outlined filled">mic</span>
          ) : (
            <span className="material-symbols-outlined filled">mic_off</span>
          )}
        </button>
        <button
          className={cn('action-button', { disabled: transcript.length === 0 })}
          onClick={handleExport}
          title="Export Conversation as Markdown"
        >
          <span className="material-symbols-outlined">download</span>
        </button>
        <button
          className={cn('action-button screen-button', { active: isCapturing })}
          onClick={isCapturing ? stopCapture : startCapture}
          title={isCapturing ? "Stop Screen Share" : "Share Screen"}
        >
          <span className="material-symbols-outlined {isCapturing ? 'filled' : ''}">
            {isCapturing ? 'cancel_presentation' : 'present_to_all'}
          </span>
        </button>
        {children}
      </nav>

      <div className={cn('connection-container', { connected })}>
        <video ref={videoRef} style={{ display: 'none' }} playsInline muted />
        <div className="connection-button-container">
          <button
            ref={connectButtonRef}
            className={cn('action-button connect-toggle', { connected })}
            onClick={connected ? disconnect : connect}
          >
            <span className="material-symbols-outlined filled">
              {connected ? 'pause' : 'play_arrow'}
            </span>
          </button>
        </div>
        <span className="text-indicator">Streaming</span>
      </div>
    </section>
  );
}

export default memo(ControlTray);
