import { create } from "zustand";
import { persist } from "zustand/middleware";
import { GeneratedPanel } from "../types";

interface ProjectState {
  // Project IDs
  projectId: string | null;
  seriesSlugState: string | null;
  chapterSlugState: string | null;

  // Metadata
  seriesTitle: string;
  chapterNumber: string;
  chapterTitle: string;
  seriesAuthor: string;
  seriesCoverImage: string;
  seriesSynopsis: string;
  scrapedGenre: string;
  scrapedTitle: string;
  targetUrl: string;

  // Assets
  panels: GeneratedPanel[];
  scrapedImages: string[];
  selectedScraped: string[];
  videoUrl: string | null;

  // UI View State
  activePreviewTab: "video" | "timeline";
  isScraping: boolean;

  // Actions
  setProjectId: (id: string | null) => void;
  setSeriesSlugState: (slug: string | null) => void;
  setChapterSlugState: (slug: string | null) => void;
  setSeriesTitle: (title: string) => void;
  setChapterNumber: (num: string) => void;
  setChapterTitle: (title: string) => void;
  setSeriesAuthor: (author: string) => void;
  setSeriesCoverImage: (image: string) => void;
  setSeriesSynopsis: (synopsis: string) => void;
  setScrapedGenre: (genre: string) => void;
  setScrapedTitle: (title: string) => void;
  setTargetUrl: (url: string) => void;
  setPanels: (panels: GeneratedPanel[]) => void;
  setScrapedImages: (images: string[]) => void;
  setSelectedScraped: (images: string[]) => void;
  setVideoUrl: (url: string | null) => void;
  setActivePreviewTab: (tab: "video" | "timeline") => void;
  setIsScraping: (isScraping: boolean) => void;
  resetWorkspace: () => void;
}

export const useProjectStore = create<ProjectState>()(
  persist(
    (set) => ({
      projectId: null,
      seriesSlugState: null,
      chapterSlugState: null,
      seriesTitle: "",
      chapterNumber: "",
      chapterTitle: "",
      seriesAuthor: "",
      seriesCoverImage: "",
      seriesSynopsis: "",
      scrapedGenre: "Fantasy Action",
      scrapedTitle: "Overpowered S-Rank Recap",
      targetUrl: "",
      panels: [],
      scrapedImages: [],
      selectedScraped: [],
      videoUrl: null,
      activePreviewTab: "video",
      isScraping: false,

      setProjectId: (projectId) => set({ projectId }),
      setSeriesSlugState: (seriesSlugState) => set({ seriesSlugState }),
      setChapterSlugState: (chapterSlugState) => set({ chapterSlugState }),
      setSeriesTitle: (seriesTitle) => set({ seriesTitle }),
      setChapterNumber: (chapterNumber) => set({ chapterNumber }),
      setChapterTitle: (chapterTitle) => set({ chapterTitle }),
      setSeriesAuthor: (seriesAuthor) => set({ seriesAuthor }),
      setSeriesCoverImage: (seriesCoverImage) => set({ seriesCoverImage }),
      setSeriesSynopsis: (seriesSynopsis) => set({ seriesSynopsis }),
      setScrapedGenre: (scrapedGenre) => set({ scrapedGenre }),
      setScrapedTitle: (scrapedTitle) => set({ scrapedTitle }),
      setTargetUrl: (targetUrl) => set({ targetUrl }),
      setPanels: (panels) => set({ panels }),
      setScrapedImages: (scrapedImages) => set({ scrapedImages }),
      setSelectedScraped: (selectedScraped) => set({ selectedScraped }),
      setVideoUrl: (videoUrl) => set({ videoUrl }),
      setActivePreviewTab: (activePreviewTab) => set({ activePreviewTab }),
      setIsScraping: (isScraping) => set({ isScraping }),

      resetWorkspace: () =>
        set({
          projectId: null,
          seriesSlugState: null,
          chapterSlugState: null,
          panels: [],
          scrapedImages: [],
          videoUrl: null,
        }),
    }),
    {
      name: "ai_comic_project_storage",
      partialize: (state) => ({ targetUrl: state.targetUrl }), // Only persist targetUrl (as in the original logic)
    }
  )
);
