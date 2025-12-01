// Componente para gravação de áudio
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAudioRecorder } from '@/lib/hooks/useAudioRecorder';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { FiMic, FiMicOff, FiTrash2, FiPause, FiPlay } from 'react-icons/fi';
import { MdSend } from 'react-icons/md';

interface AudioRecorderProps {
  onAudioRecorded: (audioBlob: Blob) => void;
  disabled?: boolean;
  reset?: boolean;
}

export function AudioRecorder({ onAudioRecorded, disabled = false, reset }: AudioRecorderProps) {
  const { 
    isRecording, 
    audioBlob, 
    permissionState, 
    startRecording, 
    stopRecording, 
    clearAudio, 
    checkPermission, 
    requestPermission 
  } = useAudioRecorder();

  // local elapsedTime because the hook does not expose it
  const [elapsedTime, setElapsedTime] = useState(0);
  useEffect(() => {
    let intervalId: number | undefined;

    if (isRecording) {
      setElapsedTime(0);
      intervalId = window.setInterval(() => {
        setElapsedTime((s) => s + 1);
      }, 1000);
    }

    return () => {
      if (intervalId !== undefined) {
        window.clearInterval(intervalId);
      }
    };
  }, [isRecording]);
  
  const [showPermissionDialog, setShowPermissionDialog] = useState(false);

  // Verificar permissão ao montar o componente
  useEffect(() => {
    checkPermission();
  }, [checkPermission]);

  const handleClick = async () => {
    if (isRecording) {
      stopRecording();
    } else {
      // Verificar permissão antes de gravar
      const currentPermission = await checkPermission();
      
      if (currentPermission === 'denied') {
        alert('Permissão para microfone foi negada. Verifique as configurações do navegador.');
        return;
      }
      
      if (currentPermission === 'unknown' || currentPermission === 'prompt') {
        setShowPermissionDialog(true);
        return;
      }
      
      // Permissão concedida, iniciar gravação
      startRecording();
    }
  };

  const handlePermissionGranted = async () => {
    setShowPermissionDialog(false);
    const granted = await requestPermission();
    if (granted) {
      startRecording();
    }
  };

  const handlePermissionDenied = () => {
    setShowPermissionDialog(false);
  };

  const fmt = (s: number) => {
    const sec = Math.floor(s % 60).toString().padStart(2, '0');
    const min = Math.floor(s / 60).toString().padStart(2, '0');
    return `${min}:${sec}`;
  };

  // Preparar URL de reprodução quando houver áudio gravado (não enviar automaticamente)
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // Limpar áudio quando prop reset for true
  useEffect(() => {
    if (typeof reset !== 'undefined' && reset) {
      clearAudio();
      setAudioUrl(null);
      setIsPlaying(false);
    }
  }, [reset, clearAudio, setAudioUrl, setIsPlaying]);
  

  useEffect(() => {
    let url: string | undefined;
    if (audioBlob) {
      url = URL.createObjectURL(audioBlob);
      setAudioUrl(url);
    }

    return () => {
      if (url) {
        URL.revokeObjectURL(url);
      }
    };
  }, [audioBlob]);

  // Quando o hook fornecer o blob final, anexar automaticamente ao pai
  useEffect(() => {
    if (audioBlob) {
      try {
        onAudioRecorded(audioBlob);
      } catch (err) {
        console.warn('Erro ao anexar áudio ao pai:', err);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioBlob]);

  const handlePlayPause = async () => {
    if (!audioRef.current && audioUrl) {
      audioRef.current = new Audio(audioUrl);
      audioRef.current.onended = () => {
        setIsPlaying(false);
        setCurrentTime(0);
      };
      audioRef.current.ontimeupdate = () => {
        setCurrentTime(audioRef.current?.currentTime || 0);
      };
    }

    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      try {
        await audioRef.current.play();
        setIsPlaying(true);
      } catch (err) {
        console.warn('Playback bloqueado pelo navegador:', err);
      }
    }
  };

  const handleDiscard = () => {
    clearAudio();
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
    setIsPlaying(false);
    setCurrentTime(0);
  };

  return (
    <>
      <div className="flex items-center gap-3">
        <Button
          onClick={handleClick}
          disabled={disabled}
          className={`p-2 rounded-full transition-all duration-200 ${
            isRecording
              ? 'bg-red-500 hover:bg-red-600 animate-pulse text-white'
              : permissionState === 'denied'
              ? 'bg-gray-400 hover:bg-gray-500 text-gray-600'
              : 'bg-primary text-primary-foreground hover:bg-primary/90'
          }`}
          title={
            permissionState === 'denied'
              ? 'Microfone bloqueado'
              : isRecording 
              ? 'Parar gravação' 
              : 'Gravar áudio'
          }
        >
          {permissionState === 'denied' ? <FiMicOff size={18} /> : <FiMic size={18} />}
        </Button>
      </div>

      {/* Progresso e tempo durante gravação */}
      {isRecording && (
        <div className="mt-2 w-48">
          <div className="text-xs text-muted-foreground">Gravando • {fmt(elapsedTime)}</div>
          <div className="h-2 bg-gray-200 rounded mt-1 overflow-hidden">
            <div
              className="h-2 bg-red-500"
              style={{ width: `${Math.min((elapsedTime / 60) * 100, 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Controles compactos de reprodução */}
      {audioUrl && (
        <div className="mt-3 w-full">
          <div className="flex items-center gap-3 bg-[#0f2b22] text-white px-3 py-2 rounded-full">
            <button
              onClick={handleDiscard}
              aria-label="Descartar"
              title="Descartar"
              className="p-1 rounded-full hover:bg-white/10"
              style={{ color: 'white' }}
            >
              <FiTrash2 size={16} />
            </button>

            <button
              onClick={handlePlayPause}
              aria-label={isPlaying ? 'Pausar' : 'Ouvir'}
              title={isPlaying ? 'Pausar' : 'Ouvir'}
              className="p-1 rounded-full bg-white text-black flex items-center justify-center"
            >
              {isPlaying ? <FiPause size={14} /> : <FiPlay size={14} />}
            </button>

            <div className="flex-1 mx-2">
              <div className="h-6 flex items-center gap-1">
                <div className="flex-1 h-1 bg-white/10 rounded overflow-hidden">
                  <div className="h-1 bg-white rounded" style={{ width: `${Math.min((currentTime / (audioRef.current?.duration || elapsedTime)) * 100, 100)}%`, transition: 'width 0.1s linear' }} />
                </div>
                <div className="ml-3 text-xs text-white/90 tabular-nums">{fmt(isPlaying ? currentTime : elapsedTime)}</div>
              </div>
            </div>

            <button
              onClick={() => {
                if (audioBlob) {
                  try { onAudioRecorded(audioBlob); } catch (err) { console.warn(err); }
                  try {
                    const sendBtn = document.querySelector('button[data-action="send"]') as HTMLButtonElement | null;
                    if (sendBtn) sendBtn.click();
                  } catch (err) {
                    console.warn('Não foi possível acionar botão Enviar automaticamente', err);
                  }
                }
              }}
              className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow"
              title="Enviar"
              aria-label="Enviar"
              disabled={!audioBlob}
            >
              <MdSend size={18} />
            </button>
          </div>
        </div>
      )}
      
      <Dialog open={showPermissionDialog} onOpenChange={setShowPermissionDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Permissão para Microfone</DialogTitle>
            <DialogDescription>
              Para gravar áudio, precisamos de acesso ao seu microfone. 
              Clique em "Permitir" quando solicitado pelo navegador.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="outline" onClick={handlePermissionDenied}>
              Cancelar
            </Button>
            <Button onClick={handlePermissionGranted}>
              Solicitar Permissão
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
