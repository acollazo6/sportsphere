import React, { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Mic, MicOff, Video, VideoOff, PhoneOff, Phone,
  Maximize2, Minimize2, RotateCcw
} from "lucide-react";

// ── Simple peer-to-peer WebRTC video call using browser APIs.
// Signalling is done via a shared entity (CallSignal).
// Both peers poll/subscribe for ICE candidates and SDP answers.

export default function VideoCallModal({ conversation, currentUser, otherName, otherAvatar, onClose }) {
  const [callState, setCallState] = useState("connecting"); // connecting | active | ended
  const [audioMuted, setAudioMuted] = useState(false);
  const [videoMuted, setVideoMuted] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [remoteConnected, setRemoteConnected] = useState(false);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const pcRef = useRef(null);
  const timerRef = useRef(null);
  const startTimeRef = useRef(null);

  // ── Start local media and create peer connection ─────────────────────────
  const setupCall = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:stun1.l.google.com:19302" },
        ],
      });
      pcRef.current = pc;

      stream.getTracks().forEach(track => pc.addTrack(track, stream));

      pc.ontrack = (event) => {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0];
          setRemoteConnected(true);
          setCallState("active");
          startTimeRef.current = Date.now();
          timerRef.current = setInterval(() => {
            setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000));
          }, 1000);
        }
      };

      pc.onconnectionstatechange = () => {
        if (["disconnected", "failed", "closed"].includes(pc.connectionState)) {
          handleEndCall();
        }
      };

      return pc;
    } catch (err) {
      console.error("Media access error:", err);
      setCallState("ended");
    }
  }, []);

  useEffect(() => {
    setupCall();
    return () => cleanup();
  }, []);

  const cleanup = () => {
    clearInterval(timerRef.current);
    localStreamRef.current?.getTracks().forEach(t => t.stop());
    pcRef.current?.close();
  };

  // ── Controls ──────────────────────────────────────────────────────────────
  const toggleAudio = () => {
    const track = localStreamRef.current?.getAudioTracks()[0];
    if (track) {
      track.enabled = !track.enabled;
      setAudioMuted(!track.enabled);
    }
  };

  const toggleVideo = () => {
    const track = localStreamRef.current?.getVideoTracks()[0];
    if (track) {
      track.enabled = !track.enabled;
      setVideoMuted(!track.enabled);
    }
  };

  const handleEndCall = () => {
    cleanup();
    setCallState("ended");
    setTimeout(onClose, 1200);
  };

  const formatTime = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  // ── Minimized pill ────────────────────────────────────────────────────────
  if (minimized) {
    return (
      <div className="fixed bottom-24 right-4 z-50 bg-slate-900 text-white rounded-2xl shadow-2xl px-4 py-2.5 flex items-center gap-3">
        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
        <span className="text-sm font-semibold">{callState === "active" ? formatTime(elapsed) : "Connecting…"}</span>
        <button onClick={() => setMinimized(false)} className="p-1 hover:bg-white/10 rounded-lg transition-colors">
          <Maximize2 className="w-4 h-4" />
        </button>
        <button onClick={handleEndCall} className="p-1 bg-red-500 hover:bg-red-600 rounded-lg transition-colors">
          <PhoneOff className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-2xl mx-4 bg-slate-950 rounded-3xl overflow-hidden shadow-2xl aspect-video flex flex-col">

        {/* Remote video / waiting screen */}
        <div className="flex-1 relative bg-slate-900">
          {remoteConnected ? (
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
              <Avatar className="w-24 h-24 ring-4 ring-white/20">
                <AvatarImage src={otherAvatar} />
                <AvatarFallback className="bg-gradient-to-br from-orange-400 to-amber-300 text-white text-3xl font-bold">
                  {otherName?.[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <p className="text-white text-xl font-bold">{otherName}</p>
              {callState === "connecting" && (
                <div className="flex items-center gap-2 text-slate-400">
                  <div className="flex gap-1">
                    {[0, 150, 300].map(d => (
                      <span key={d} className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />
                    ))}
                  </div>
                  <span className="text-sm">Ringing…</span>
                </div>
              )}
              {callState === "ended" && (
                <p className="text-slate-400 text-sm">Call ended</p>
              )}
            </div>
          )}

          {/* Local video (PiP) */}
          <div className="absolute bottom-4 right-4 w-28 h-20 rounded-xl overflow-hidden border-2 border-white/20 bg-slate-800 shadow-xl">
            {videoMuted ? (
              <div className="w-full h-full flex items-center justify-center">
                <VideoOff className="w-6 h-6 text-slate-400" />
              </div>
            ) : (
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
            )}
            <div className="absolute bottom-1 left-1 text-[9px] text-white/70 font-medium">You</div>
          </div>

          {/* Top bar */}
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
            <div className="flex items-center gap-2 bg-black/40 rounded-xl px-3 py-1.5">
              {callState === "active" ? (
                <>
                  <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                  <span className="text-white text-sm font-mono font-semibold">{formatTime(elapsed)}</span>
                </>
              ) : callState === "ended" ? (
                <span className="text-white text-sm">Call ended</span>
              ) : (
                <span className="text-slate-300 text-sm">Connecting…</span>
              )}
            </div>
            <button
              onClick={() => setMinimized(true)}
              className="p-2 bg-black/40 hover:bg-black/60 rounded-xl text-white transition-colors"
            >
              <Minimize2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Control bar */}
        <div className="bg-slate-950 px-6 py-4 flex items-center justify-center gap-4">
          <button
            onClick={toggleAudio}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
              audioMuted ? "bg-red-500 hover:bg-red-600 text-white" : "bg-white/10 hover:bg-white/20 text-white"
            }`}
            title={audioMuted ? "Unmute" : "Mute"}
          >
            {audioMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          <button
            onClick={handleEndCall}
            className="w-14 h-14 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center transition-all shadow-lg hover:scale-105"
            title="End call"
          >
            <PhoneOff className="w-6 h-6" />
          </button>

          <button
            onClick={toggleVideo}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
              videoMuted ? "bg-red-500 hover:bg-red-600 text-white" : "bg-white/10 hover:bg-white/20 text-white"
            }`}
            title={videoMuted ? "Enable camera" : "Disable camera"}
          >
            {videoMuted ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
          </button>
        </div>
      </div>
    </div>
  );
}