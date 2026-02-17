import React, { useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Mic, MicOff, Loader2, Square } from "lucide-react";

export default function VoiceRecorder({ onTranscribed, disabled }) {
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mediaRecorder = new MediaRecorder(stream);
    chunksRef.current = [];
    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    mediaRecorder.onstop = async () => {
      stream.getTracks().forEach(t => t.stop());
      setTranscribing(true);
      const blob = new Blob(chunksRef.current, { type: "audio/webm" });
      const file = new File([blob], "voice.webm", { type: "audio/webm" });
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: "Transcribe this audio recording. Return ONLY the transcribed text, nothing else. If you cannot transcribe, return an empty string.",
        file_urls: [file_url],
      });
      setTranscribing(false);
      if (result?.trim()) onTranscribed(result.trim());
    };
    mediaRecorderRef.current = mediaRecorder;
    mediaRecorder.start();
    setRecording(true);
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  };

  if (transcribing) {
    return (
      <button disabled className="p-2 rounded-xl text-orange-400 flex-shrink-0" title="Transcribing...">
        <Loader2 className="w-5 h-5 animate-spin" />
      </button>
    );
  }

  if (recording) {
    return (
      <button
        onClick={stopRecording}
        className="p-2 rounded-xl bg-red-100 text-red-500 hover:bg-red-200 transition-colors flex-shrink-0 animate-pulse"
        title="Stop recording"
      >
        <Square className="w-5 h-5 fill-red-500" />
      </button>
    );
  }

  return (
    <button
      onClick={startRecording}
      disabled={disabled}
      className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors flex-shrink-0 disabled:opacity-50"
      title="Record voice message (transcribed to text)"
    >
      <Mic className="w-5 h-5" />
    </button>
  );
}