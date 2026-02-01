import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, Square, Play, Pause, Trash2, Upload } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';

export default function VoiceNoteRecorder({ onVoiceNoteUploaded, existingUrl }) {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(existingUrl || null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioPlayerRef = useRef(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(audioBlob);
        setAudioUrl(URL.createObjectURL(audioBlob));
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      toast.success('Recording started...');
    } catch (error) {
      console.error('Error starting recording:', error);
      toast.error('Could not access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      toast.success('Recording stopped!');
    }
  };

  const playAudio = () => {
    if (audioPlayerRef.current) {
      audioPlayerRef.current.play();
      setIsPlaying(true);
    }
  };

  const pauseAudio = () => {
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      setIsPlaying(false);
    }
  };

  const deleteRecording = () => {
    setAudioBlob(null);
    setAudioUrl(null);
    setIsPlaying(false);
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      audioPlayerRef.current.currentTime = 0;
    }
    onVoiceNoteUploaded(null);
  };

  const uploadVoiceNote = async () => {
    if (!audioBlob) return;

    setIsUploading(true);
    try {
      // Convert blob to file
      const file = new File([audioBlob], `voice-note-${Date.now()}.webm`, { type: 'audio/webm' });
      
      // Upload using base44
      const result = await base44.integrations.Core.UploadFile({ file });
      
      toast.success('Voice note uploaded!');
      onVoiceNoteUploaded(result.file_url);
      setAudioUrl(result.file_url);
    } catch (error) {
      console.error('Error uploading voice note:', error);
      toast.error('Failed to upload voice note');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <label className="body-font text-sm text-gray-700 block">
        🎤 Voice Instructions (Premium)
      </label>

      <AnimatePresence mode="wait">
        {!audioUrl ? (
          <motion.div
            key="recorder"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {!isRecording ? (
              <Button
                type="button"
                onClick={startRecording}
                className="funky-button bg-red-500 text-white w-full"
              >
                <Mic className="w-5 h-5 mr-2" />
                Start Recording
              </Button>
            ) : (
              <motion.div
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ repeat: Infinity, duration: 1 }}
              >
                <Button
                  type="button"
                  onClick={stopRecording}
                  className="funky-button bg-red-600 text-white w-full"
                >
                  <Square className="w-5 h-5 mr-2" />
                  Stop Recording
                </Button>
              </motion.div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="player"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="funky-card p-4 bg-blue-50 border-2 border-blue-300"
          >
            <audio
              ref={audioPlayerRef}
              src={audioUrl}
              onEnded={() => setIsPlaying(false)}
              className="hidden"
            />
            
            <div className="flex items-center gap-3">
              <Button
                type="button"
                onClick={isPlaying ? pauseAudio : playAudio}
                size="icon"
                className="funky-button bg-blue-500 text-white"
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </Button>

              <div className="flex-1">
                <p className="body-font text-sm text-gray-700">Voice Note</p>
                <div className="h-1 bg-blue-200 rounded-full mt-1">
                  <div className="h-1 bg-blue-500 rounded-full w-0" />
                </div>
              </div>

              {audioBlob && !existingUrl && (
                <Button
                  type="button"
                  onClick={uploadVoiceNote}
                  size="sm"
                  disabled={isUploading}
                  className="funky-button bg-green-500 text-white"
                >
                  <Upload className="w-4 h-4 mr-1" />
                  {isUploading ? 'Uploading...' : 'Save'}
                </Button>
              )}

              <Button
                type="button"
                onClick={deleteRecording}
                size="icon"
                variant="ghost"
                className="text-red-500 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <p className="body-font-light text-xs text-gray-500">
        Record audio instructions for younger kids who can't read yet
      </p>
    </div>
  );
}