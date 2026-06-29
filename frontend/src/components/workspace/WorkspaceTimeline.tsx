// ============================================================================
// WorkspaceTimeline.tsx — Bottom Multi-Track Timeline Editor
// ============================================================================

import React, { useState } from "react";
import {
  Film,
  Music,
  Mic,
  Plus,
  Play,
  Pause,
  RotateCcw,
  ZoomIn,
  ZoomOut,
} from "lucide-react";

interface TimelineTrackItem {
  id: string;
  name: string;
  duration: number; // in seconds
  startOffset: number; // offset in seconds from start
  type: "video" | "audio" | "voice";
}

const INITIAL_ITEMS: TimelineTrackItem[] = [
  { id: "v1", name: "Panel #1 (Intr.)", duration: 3.7, startOffset: 0, type: "video" },
  { id: "v2", name: "Panel #2 (Action)", duration: 4.2, startOffset: 3.7, type: "video" },
  { id: "v3", name: "Panel #3 (Dialogue)", duration: 2.8, startOffset: 7.9, type: "video" },
  { id: "v4", name: "Panel #4 (Climax)", duration: 3.7, startOffset: 10.7, type: "video" },
  { id: "v5", name: "Panel #5 (Close)", duration: 4.0, startOffset: 14.4, type: "video" },

  { id: "a1", name: "Cyberpunk Ambient Theme", duration: 12.0, startOffset: 0, type: "audio" },
  { id: "a2", name: "Impact SFX", duration: 3.0, startOffset: 10.7, type: "audio" },

  { id: "vo1", name: "Voiceover - Scene 1", duration: 3.0, startOffset: 0.5, type: "voice" },
  { id: "vo2", name: "Voiceover - Scene 3", duration: 2.5, startOffset: 8.0, type: "voice" },
];

export default function WorkspaceTimeline() {
  const [items] = useState<TimelineTrackItem[]>(INITIAL_ITEMS);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playheadTime, setPlayheadTime] = useState(4.5); // current playhead time in seconds
  const [zoomLevel, setZoomLevel] = useState(25); // px per second

  const totalDuration = 18.4; // total project duration in seconds

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left - 96; // 96px offset for track headers
    if (clickX >= 0) {
      const clickedTime = Math.min(Math.max(clickX / zoomLevel, 0), totalDuration);
      setPlayheadTime(clickedTime);
    }
  };

  const videoItems = items.filter((i) => i.type === "video");
  const audioItems = items.filter((i) => i.type === "audio");
  const voiceItems = items.filter((i) => i.type === "voice");

  // Render tick marks for time scale
  const renderTimeTicks = () => {
    const ticks = [];
    const interval = totalDuration > 30 ? 5 : 2; // seconds between ticks
    for (let i = 0; i <= totalDuration; i += interval) {
      ticks.push(
        <div
          key={i}
          className="absolute border-l border-neutral-800 h-2.5 flex flex-col justify-between"
          style={{ left: `${96 + i * zoomLevel}px` }}
        >
          <span className="text-[9px] font-mono text-neutral-600 -translate-x-1/2 -translate-y-4">
            0:{i.toString().padStart(2, "0")}
          </span>
        </div>
      );
    }
    return ticks;
  };

  return (
    <div className="h-56 flex flex-col border-t border-neutral-900 bg-neutral-950/90 text-neutral-100 overflow-hidden select-none">
      {/* Timeline Controls Header */}
      <div className="h-9 flex items-center justify-between px-4 border-b border-neutral-900 bg-neutral-950/80">
        {/* Playback Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="p-1 rounded bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 border border-purple-800/40 hover:border-purple-600/50 cursor-pointer transition-all"
            title={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? (
              <Pause className="h-3 w-3 fill-current" />
            ) : (
              <Play className="h-3 w-3 fill-current" />
            )}
          </button>
          <button
            onClick={() => setPlayheadTime(0)}
            className="p-1 rounded bg-neutral-900 hover:bg-neutral-800 text-neutral-500 hover:text-white border border-neutral-800 transition-all cursor-pointer"
            title="Reset Playhead"
          >
            <RotateCcw className="h-3 w-3" />
          </button>
          <div className="text-[10px] font-mono text-neutral-400 pl-2">
            Time:{" "}
            <span className="text-purple-400 font-bold">
              {playheadTime.toFixed(2)}s
            </span>{" "}
            / {totalDuration.toFixed(1)}s
          </div>
        </div>

        {/* Tracks actions & Zoom */}
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-1.5 px-2 py-1 rounded bg-neutral-900 border border-neutral-800 hover:bg-neutral-850 text-neutral-400 hover:text-white transition-all text-[9px] font-mono cursor-pointer">
            <Plus className="h-3 w-3" /> Add Audio Track
          </button>

          <div className="flex items-center gap-1.5 border-l border-neutral-900 pl-3">
            <button
              onClick={() => setZoomLevel((z) => Math.max(z - 5, 10))}
              className="p-1 rounded text-neutral-500 hover:text-white cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut className="h-3 w-3" />
            </button>
            <span className="text-[9px] font-mono text-neutral-600 w-10 text-center">
              {Math.round((zoomLevel / 25) * 100)}%
            </span>
            <button
              onClick={() => setZoomLevel((z) => Math.min(z + 5, 50))}
              className="p-1 rounded text-neutral-500 hover:text-white cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Tracks Workspace Panel */}
      <div
        className="flex-1 overflow-x-auto overflow-y-hidden relative flex flex-col scrollbar-thin"
        onClick={handleTimelineClick}
      >
        {/* Time Scale Bar */}
        <div className="h-6 bg-neutral-950 border-b border-neutral-900/60 relative w-max min-w-full">
          {renderTimeTicks()}
        </div>

        {/* Tracks List */}
        <div className="flex-1 flex flex-col w-max min-w-full relative divide-y divide-neutral-900/40">
          
          {/* TRACK 1: VIDEO (PANELS) */}
          <div className="h-10 flex items-center relative group">
            {/* Track Header */}
            <div className="absolute left-0 w-24 h-full bg-neutral-950 border-r border-neutral-900/60 px-3 flex items-center gap-2 z-10 select-none">
              <Film className="h-3.5 w-3.5 text-purple-400" />
              <span className="text-[10px] font-mono text-neutral-400 font-bold">Video</span>
            </div>
            {/* Track Blocks container */}
            <div className="pl-[96px] relative h-full flex items-center w-full bg-neutral-900/10">
              {videoItems.map((item) => (
                <div
                  key={item.id}
                  className="absolute h-7 rounded bg-purple-900/30 hover:bg-purple-900/45 border border-purple-800/40 hover:border-purple-600/50 flex items-center px-2 cursor-pointer transition-all"
                  style={{
                    left: `${item.startOffset * zoomLevel}px`,
                    width: `${item.duration * zoomLevel}px`,
                  }}
                >
                  <span className="text-[9px] font-mono text-purple-300 font-bold truncate">
                    {item.name}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* TRACK 2: AUDIO (SFX & MUSIC) */}
          <div className="h-10 flex items-center relative group">
            <div className="absolute left-0 w-24 h-full bg-neutral-950 border-r border-neutral-900/60 px-3 flex items-center gap-2 z-10 select-none">
              <Music className="h-3.5 w-3.5 text-sky-400" />
              <span className="text-[10px] font-mono text-neutral-400 font-bold">Audio</span>
            </div>
            <div className="pl-[96px] relative h-full flex items-center w-full bg-neutral-900/10">
              {audioItems.map((item) => (
                <div
                  key={item.id}
                  className="absolute h-7 rounded bg-sky-900/30 hover:bg-sky-900/45 border border-sky-800/40 hover:border-sky-600/50 flex items-center px-2 cursor-pointer transition-all"
                  style={{
                    left: `${item.startOffset * zoomLevel}px`,
                    width: `${item.duration * zoomLevel}px`,
                  }}
                >
                  <span className="text-[9px] font-mono text-sky-300 truncate">
                    {item.name}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* TRACK 3: VOICE (NARRATION / DIALOGUE) */}
          <div className="h-10 flex items-center relative group">
            <div className="absolute left-0 w-24 h-full bg-neutral-950 border-r border-neutral-900/60 px-3 flex items-center gap-2 z-10 select-none">
              <Mic className="h-3.5 w-3.5 text-rose-400" />
              <span className="text-[10px] font-mono text-neutral-400 font-bold">Voice</span>
            </div>
            <div className="pl-[96px] relative h-full flex items-center w-full bg-neutral-900/10">
              {voiceItems.map((item) => (
                <div
                  key={item.id}
                  className="absolute h-7 rounded bg-rose-900/30 hover:bg-rose-900/45 border border-rose-800/40 hover:border-rose-600/50 flex items-center px-2 cursor-pointer transition-all"
                  style={{
                    left: `${item.startOffset * zoomLevel}px`,
                    width: `${item.duration * zoomLevel}px`,
                  }}
                >
                  <span className="text-[9px] font-mono text-rose-300 truncate">
                    {item.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* PLAYHEAD INDICATOR */}
        <div
          className="absolute top-0 bottom-0 border-l-2 border-purple-500 z-30 pointer-events-none transition-all duration-75"
          style={{ left: `${96 + playheadTime * zoomLevel}px` }}
        >
          <div className="w-3 h-3 bg-purple-500 rounded-sm rotate-45 -translate-x-1.5 -translate-y-1.5 border border-white" />
        </div>
      </div>
    </div>
  );
}
