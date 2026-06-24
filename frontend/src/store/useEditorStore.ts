import { create } from "zustand";
import { persist } from "zustand/middleware";
import { AI_MODELS } from "../models";
import { NarrationStyle, AspectRatio } from "../types/constants";

interface EditorState {
  voiceActor: string;
  musicTheme: string;
  aspectRatio: string;
  selectedModel: string;
  selectedSource: string;
  frameRate: number;
  volume: number;
  isMuted: boolean;
  narrationStyle: string;
  smartSlice: boolean;

  setVoiceActor: (actor: string) => void;
  setMusicTheme: (theme: string) => void;
  setAspectRatio: (ratio: string) => void;
  setSelectedModel: (model: string) => void;
  setSelectedSource: (source: string) => void;
  setFrameRate: (fps: number) => void;
  setVolume: (vol: number) => void;
  setIsMuted: (muted: boolean) => void;
  setNarrationStyle: (style: string) => void;
  setSmartSlice: (slice: boolean) => void;
}

export const useEditorStore = create<EditorState>()(
  persist(
    (set) => ({
      voiceActor: "Standard Comic Narrator (Male)",
      musicTheme: "Orchestral Battle Theme",
      aspectRatio: AspectRatio.PORTRAIT,
      selectedModel: AI_MODELS[0].id,
      selectedSource: "webtoons",
      frameRate: 24,
      volume: 80,
      isMuted: false,
      narrationStyle: NarrationStyle.LONG,
      smartSlice: true,

      setVoiceActor: (voiceActor) => set({ voiceActor }),
      setMusicTheme: (musicTheme) => set({ musicTheme }),
      setAspectRatio: (aspectRatio) => set({ aspectRatio }),
      setSelectedModel: (selectedModel) => set({ selectedModel }),
      setSelectedSource: (selectedSource) => set({ selectedSource }),
      setFrameRate: (frameRate) => set({ frameRate }),
      setVolume: (volume) => set({ volume }),
      setIsMuted: (isMuted) => set({ isMuted }),
      setNarrationStyle: (narrationStyle) => set({ narrationStyle }),
      setSmartSlice: (smartSlice) => set({ smartSlice }),
    }),
    {
      name: "ai_comic_editor_settings",
      // Map Zustand's persist keys back to the original localStorage keys if needed
      // Or just let it use its own combined JSON string (recommended for Zustand)
    }
  )
);
