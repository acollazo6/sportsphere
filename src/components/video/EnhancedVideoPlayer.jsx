import React, { useRef, useState, useEffect } from "react";
import { Play, Pause } from "lucide-react";

export default function EnhancedVideoPlayer({ 
  src, 
  onDoubleTap, 
  isActive, 
  className = "" 
}) {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [showPlayPause, setShowPlayPause] = useState(false);
  
  // Touch gesture tracking
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const lastTapTime = useRef(0);
  const tapCount = useRef(0);
  const swipeThreshold = 50;
  const doubleTapDelay = 300;

  // Update video state when isActive changes
  useEffect(() => {
    if (videoRef.current) {
      if (isActive) {
        videoRef.current.play().catch(() => {});
        setIsPlaying(true);
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  }, [isActive]);

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handlePlayPause = (e) => {
    e.stopPropagation();
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current.play().catch(() => {});
        setIsPlaying(true);
      }
      setShowPlayPause(true);
      setTimeout(() => setShowPlayPause(false), 1000);
    }
  };

  const handleProgressClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const newTime = percentage * duration;
    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    
    const now = Date.now();
    const timeSinceLastTap = now - lastTapTime.current;
    
    if (timeSinceLastTap < doubleTapDelay) {
      tapCount.current += 1;
      if (tapCount.current === 2) {
        // Double tap detected
        onDoubleTap?.();
        tapCount.current = 0;
      }
    } else {
      tapCount.current = 1;
    }
    lastTapTime.current = now;
  };

  const handleTouchEnd = (e) => {
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    
    const deltaX = touchEndX - touchStartX.current;
    const deltaY = touchEndY - touchStartY.current;
    
    // Swipe detection (horizontal)
    const isHorizontalSwipe = Math.abs(deltaX) > Math.abs(deltaY);
    
    if (isHorizontalSwipe && Math.abs(deltaX) > swipeThreshold) {
      if (deltaX < 0) {
        // Swiped left - next video
        window.dispatchEvent(new CustomEvent("reelSwipeNext"));
      } else {
        // Swiped right - previous video
        window.dispatchEvent(new CustomEvent("reelSwipePrev"));
      }
    }
  };

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const progressPercent = duration ? (currentTime / duration) * 100 : 0;

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full bg-slate-950 overflow-hidden group cursor-pointer ${className}`}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onClick={handlePlayPause}
    >
      {/* Video */}
      <video
        ref={videoRef}
        src={src}
        className="absolute inset-0 w-full h-full object-cover"
        loop
        playsInline
        muted
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
      />

      {/* Play/Pause Indicator */}
      {showPlayPause && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-slate-950/70 backdrop-blur-sm rounded-full p-6 animate-bounce">
            {isPlaying ? (
              <Play className="w-12 h-12 text-white fill-white" />
            ) : (
              <Pause className="w-12 h-12 text-white fill-white" />
            )}
          </div>
        </div>
      )}

      {/* Progress Bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-950/30 cursor-pointer hover:h-1.5 transition-all group-hover:h-1.5 z-20"
        onClick={handleProgressClick}
      >
        <div
          className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-100"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Time Display */}
      <div className="absolute bottom-3 right-3 text-xs text-white/70 font-mono bg-slate-950/40 backdrop-blur-sm px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
        {formatTime(currentTime)} / {formatTime(duration)}
      </div>
    </div>
  );
}