import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Music, Volume2, X, Plus, Trash2, Waves, Zap } from "lucide-react";

export default function AudioEffectsPanel({ onAudioChange, videoFile }) {
  const [audioFile, setAudioFile] = useState(null);
  const [audioVolume, setAudioVolume] = useState(100);
  const [soundEffects, setSoundEffects] = useState([]);
  const [micVolume, setMicVolume] = useState(70);
  const [useVideoAudio, setUseVideoAudio] = useState(true);
  const [equalizerPreset, setEqualizerPreset] = useState("balanced");
  const audioRef = useRef(null);
  const sfxRef = useRef(null);

  const handleAudioUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setAudioFile(file);
      onAudioChange?.({ file, volume: audioVolume });
    }
  };

  const handleRemoveAudio = () => {
    setAudioFile(null);
    setAudioVolume(100);
    onAudioChange?.(null);
  };

  const handleVolumeChange = (vals) => {
    const newVolume = vals[0];
    setAudioVolume(newVolume);
    if (audioFile) {
      onAudioChange?.({ 
        file: audioFile, 
        volume: newVolume,
        micVolume: useVideoAudio ? micVolume : 0,
        soundEffects,
        equalizerPreset
      });
    }
  };

  const handleAddSoundEffect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const effect = {
        id: Date.now(),
        file,
        volume: 80,
        startTime: 0
      };
      setSoundEffects(prev => [...prev, effect]);
      onAudioChange?.({ 
        file: audioFile, 
        volume: audioVolume,
        micVolume: useVideoAudio ? micVolume : 0,
        soundEffects: [...soundEffects, effect],
        equalizerPreset
      });
    }
    e.target.value = "";
  };

  const removeSoundEffect = (id) => {
    const updated = soundEffects.filter(s => s.id !== id);
    setSoundEffects(updated);
    onAudioChange?.({ 
      file: audioFile, 
      volume: audioVolume,
      micVolume: useVideoAudio ? micVolume : 0,
      soundEffects: updated,
      equalizerPreset
    });
  };

  const updateSoundEffect = (id, updates) => {
    const updated = soundEffects.map(s => s.id === id ? { ...s, ...updates } : s);
    setSoundEffects(updated);
    onAudioChange?.({ 
      file: audioFile, 
      volume: audioVolume,
      micVolume: useVideoAudio ? micVolume : 0,
      soundEffects: updated,
      equalizerPreset
    });
  };

  return (
    <div className="space-y-3">
      <p className="text-xs text-slate-500">Add background audio or music to your video.</p>
      
      {!audioFile ? (
        <div className="relative">
          <input
            type="file"
            accept="audio/*"
            onChange={handleAudioUpload}
            className="hidden"
            ref={audioRef}
          />
          <button
            onClick={() => audioRef.current?.click()}
            className="w-full py-6 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 hover:bg-slate-100 flex flex-col items-center justify-center gap-2 text-slate-500 transition-all cursor-pointer"
          >
            <Music className="w-6 h-6" />
            <span className="text-sm font-medium">Upload Audio File</span>
            <span className="text-xs text-slate-400">MP3, WAV, M4A, OGG</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-xl p-3">
            <div className="flex items-center gap-2 flex-1">
              <Music className="w-4 h-4 text-blue-600" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-blue-900 truncate">{audioFile.name}</p>
                <p className="text-xs text-blue-700">{(audioFile.size / 1024 / 1024).toFixed(1)} MB</p>
              </div>
            </div>
            <button
              onClick={handleRemoveAudio}
              className="p-1.5 hover:bg-blue-100 rounded-lg transition-colors"
            >
              <X className="w-4 h-4 text-blue-600" />
            </button>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-slate-500 uppercase tracking-wide">Volume</Label>
              <span className="text-sm font-semibold text-slate-700">{audioVolume}%</span>
            </div>
            <Slider
              min={0}
              max={100}
              step={1}
              value={[audioVolume]}
              onValueChange={handleVolumeChange}
              className="my-2"
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleVolumeChange([0])}
                className="rounded-xl text-xs flex-1"
              >
                <Volume2 className="w-3 h-3 mr-1" /> Mute
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleVolumeChange([100])}
                className="rounded-xl text-xs flex-1"
              >
                Full Volume
              </Button>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
            <p className="text-xs text-amber-800">
              ℹ️ Audio will be mixed with your video. Ensure you have rights to use this audio.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}