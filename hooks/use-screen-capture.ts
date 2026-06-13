import { useState, useCallback } from 'react';

export function useScreenCapture() {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);

  const startCapture = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          displaySurface: 'monitor',
        },
        audio: false,
      });
      setStream(mediaStream);
      setIsCapturing(true);

      mediaStream.getVideoTracks()[0].onended = () => {
        setIsCapturing(false);
        setStream(null);
      };
    } catch (err: any) {
      console.error('Error capturing screen:', err);
      if (err.name === 'NotAllowedError') {
        alert('Screen capture permission was denied.');
      } else {
        alert('Failed to capture screen: ' + err.message);
      }
    }
  }, []);

  const stopCapture = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setIsCapturing(false);
  }, [stream]);

  return { stream, isCapturing, startCapture, stopCapture };
}
