// Hook personalizado para gravação de áudio
'use client';

import { useState, useRef, useCallback } from 'react';

type PermissionState = 'unknown' | 'granted' | 'denied' | 'prompt';

export function useAudioRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [permissionState, setPermissionState] = useState<PermissionState>('unknown');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Verificar estado da permissão
  const checkPermission = useCallback(async (): Promise<PermissionState> => {
    if (!navigator.permissions) {
      return 'unknown';
    }

    try {
      const permission = await navigator.permissions.query({ name: 'microphone' as PermissionName });
      setPermissionState(permission.state);
      return permission.state;
    } catch (error) {
      console.warn('Não foi possível verificar permissão do microfone:', error);
      return 'unknown';
    }
  }, []);

  // Converte um Blob de áudio decodificável para MP3 usando lamejs
  async function convertBlobToMp3(sourceBlob: Blob): Promise<Blob> {
    // Decodificar com WebAudio
    const arrayBuffer = await sourceBlob.arrayBuffer();
    const AudioCtx = (window as any).AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) throw new Error('AudioContext não suportado');
    const audioCtx = new AudioCtx();
    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);

    const numChannels = audioBuffer.numberOfChannels;
    const sampleRate = audioBuffer.sampleRate;

    // Importar lamejs dinamicamente
    const lame = await import('lamejs');
    const Mp3Encoder = (lame as any).Mp3Encoder || (lame as any).default?.Mp3Encoder;
    if (!Mp3Encoder) throw new Error('lamejs Mp3Encoder não encontrado');

    const mp3encoder = new Mp3Encoder(numChannels, sampleRate, 128);

    const samplesPerFrame = 1152;
    const left = audioBuffer.getChannelData(0);
    const right = numChannels > 1 ? audioBuffer.getChannelData(1) : null;

    const mp3Data: Uint8Array[] = [];

    function floatTo16BitPCM(float32Array: Float32Array) {
      const l = float32Array.length;
      const buffer = new Int16Array(l);
      for (let i = 0; i < l; i++) {
        let s = Math.max(-1, Math.min(1, float32Array[i]));
        buffer[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
      }
      return buffer;
    }

    for (let i = 0; i < left.length; i += samplesPerFrame) {
      const leftSlice = left.subarray(i, i + samplesPerFrame);
      const left16 = floatTo16BitPCM(leftSlice);

      if (right) {
        const rightSlice = right.subarray(i, i + samplesPerFrame);
        const right16 = floatTo16BitPCM(rightSlice);
        const mp3buf = mp3encoder.encodeBuffer(left16, right16);
        if (mp3buf.length > 0) mp3Data.push(new Uint8Array(mp3buf));
      } else {
        const mp3buf = mp3encoder.encodeBuffer(left16);
        if (mp3buf.length > 0) mp3Data.push(new Uint8Array(mp3buf));
      }
    }

    const endBuf = mp3encoder.flush();
    if (endBuf.length > 0) mp3Data.push(new Uint8Array(endBuf));

    // Concatenar todos os pedaços
    let totalLength = 0;
    for (const part of mp3Data) totalLength += part.length;
    const result = new Uint8Array(totalLength);
    let offset = 0;
    for (const part of mp3Data) {
      result.set(part, offset);
      offset += part.length;
    }

    return new Blob([result], { type: 'audio/mpeg' });
  }

  // Solicitar permissão
  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Liberar o stream imediatamente, pois vamos solicitar novamente na gravação
      stream.getTracks().forEach(track => track.stop());
      setPermissionState('granted');
      return true;
    } catch (error) {
      console.error('Permissão negada:', error);
      setPermissionState('denied');
      return false;
    }
  }, []);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      // Tentar criar MediaRecorder com mimeType mp3 se suportado
      let mediaRecorder: MediaRecorder;
      try {
        const options: MediaRecorderOptions = {};
        if ((window as any).MediaRecorder && typeof (window as any).MediaRecorder.isTypeSupported === 'function') {
          if ((window as any).MediaRecorder.isTypeSupported('audio/mpeg')) {
            (options as any).mimeType = 'audio/mpeg';
          } else if ((window as any).MediaRecorder.isTypeSupported('audio/mp3')) {
            (options as any).mimeType = 'audio/mp3';
          }
        }
        mediaRecorder = new MediaRecorder(stream, options);
      } catch (err) {
        // Fallback para comportamento padrão
        mediaRecorder = new MediaRecorder(stream as MediaStream);
      }
      mediaRecorderRef.current = mediaRecorder;

      const chunks: Blob[] = [];
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        // Criar blob com o tipo retornado pelo recorder (se houver)
        const mimeType = chunks.length > 0 && (chunks[0] as Blob).type ? (chunks[0] as Blob).type : undefined;
        const blob = new Blob(chunks, { type: mimeType || 'application/octet-stream' });

        // Se já for mp3/mpeg, usar diretamente
        if (blob.type.includes('mpeg') || blob.type.includes('mp3')) {
          setAudioBlob(blob);
        } else {
          try {
            const mp3Blob = await convertBlobToMp3(blob);
            setAudioBlob(mp3Blob);
          } catch (err) {
            console.error('Falha ao converter para MP3, enviando blob original:', err);
            setAudioBlob(blob);
          }
        }

        // Limpar stream
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      setPermissionState('granted');
    } catch (error) {
      console.error('Erro ao iniciar gravação:', error);
      setPermissionState('denied');
      alert('Erro ao acessar microfone. Verifique as permissões.');
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }, [isRecording]);

  const clearAudio = useCallback(() => {
    setAudioBlob(null);
  }, []);

  return {
    isRecording,
    audioBlob,
    permissionState,
    startRecording,
    stopRecording,
    clearAudio,
    checkPermission,
    requestPermission,
  };
}