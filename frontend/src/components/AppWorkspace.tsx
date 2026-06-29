import React from "react";
import * as api from "../api/index.js";
import UrlInputPanel from "./scraper/UrlInputPanel.js";
import ProjectConfirmModal from "./scraper/ProjectConfirmModal.js";
import { LogEntry } from "../types/logs";

interface AppWorkspaceProps {
  isDashboardOnly?: boolean;
  projectId: string | null;
  panels: any[];
  setPanels: any;
  isGeneratingStoryboard?: boolean;
  handleGenerateStoryboardAI?: () => Promise<void>;
  consoleLogs: LogEntry[];
  setConsoleLogs: any;
  scrapedImages: string[];
  setScrapedImages: any;
  selectedScraped: string[];
  setSelectedScraped: any;
  activePreviewTab: "video" | "timeline";
  setActivePreviewTab: (tab: "video" | "timeline") => void;
  setEditingImageIdx: (idx: number | null) => void;
  setEditCropTop: (v: number) => void;
  setEditCropBottom: (v: number) => void;
  setEditCropLeft: (v: number) => void;
  setEditCropRight: (v: number) => void;
  setEditAutoTrim: (v: boolean) => void;
  showBubbleModal: boolean;
  setShowBubbleModal: (v: boolean) => void;
  playStoryboardAudio: (idx: number, forcePlay?: boolean) => void;
  isCleaningBubbles: boolean;
  cleanProgress: any;
  bubbleCroppingImgUrl: string | null;
  showAutoCropModal: boolean;
  setShowAutoCropModal: (v: boolean) => void;
  isBatchCropping: boolean;
  batchProgress: any;
  croppingImgUrl: string | null;
  handleAutoCropSelected: () => void;
  handleCleanBubblesSelected: () => void;
  handleCancelBatch?: () => void;
  videoPlayerRef: React.RefObject<HTMLVideoElement | null>;
  addNotification: any;
  setErrorPopup: any;
  fetchWithInterceptor: any;
  targetUrl: string;
  setTargetUrl: (v: string) => void;
  selectedSource: string;
  setSelectedSource: (v: string) => void;
  selectedModel: string;
  setSelectedModel: (v: string) => void;
  isProcessing: boolean;
  handleGenerateVideo: () => void;
  isScraping: boolean;
  scrapeImages: (
    customUrl?: string,
    overrideProjectId?: string
  ) => Promise<void>;
  mergingIndices: number[];
  handleStitchWithNext: (idx: number) => Promise<void>;
  addPanelsToStoryboard: (
    urls: string[],
    currentScrapedList?: string[],
    shouldScroll?: boolean
  ) => void;
  progressStatus: any;
  videoUrl: string | null;
  setVideoUrl: any;
  aspectRatio: "9:16" | "16:9";
  currentPanelIndex: number;
  setCurrentPanelIndex: (idx: number) => void;
  playbackTime: number;
  setPlaybackTime: (time: number) => void;
  reprocessingPanelId: number | null;
  storyboardPlaying: boolean;
  toggleStoryboardPlayback: () => void;
  resetStoryboardPlayback: () => void;
  isMuted: boolean;
  setIsMuted: (v: boolean) => void;
  volume: number;
  setVolume: (v: number) => void;
  musicTheme: string;
  voiceActor: string;
  narrationStyle: string;
  setNarrationStyle: (v: string) => void;
  bubbleSensitivity?: number;
  bubbleDetectionStyle?: string;
  bubbleEraseMethod?: string;
  bubbleDilation?: number;
  bubbleInpaintRadius?: number;
  cropSensitivity?: number;
  cropBackgroundMode?: string;
  aspectRatioLock?: string;
  minPanelAreaPct?: number;
  overlapMergeThreshold?: number;
  useLocalCV?: boolean;
  autoSplitTallStrips?: boolean;
  cropModel?: string;
  cropMinHeightPx?: number;
  cropCannyLow?: number;
  cropCannyHigh?: number;
  cropCloseKernelSize?: number;
  seriesTitle: string;
  setSeriesTitle: (v: string) => void;
  chapterNumber: string;
  setChapterNumber: (v: string) => void;
  chapterTitle: string;
  setChapterTitle: (v: string) => void;
  scrapedGenre: string;
  setScrapedGenre: (v: string) => void;
  seriesAuthor: string;
  setSeriesAuthor: (v: string) => void;
  seriesCoverImage: string;
  setSeriesCoverImage: (v: string) => void;
  seriesSynopsis: string;
  setSeriesSynopsis: (v: string) => void;
  smartSlice?: boolean;
  setSmartSlice?: (v: boolean) => void;
  showScrapeConfirmModal: boolean;
  setShowScrapeConfirmModal: (v: boolean) => void;
  saveProject?: (customPanels?: any[], options?: any) => Promise<boolean>;
  resetWorkspace?: () => void;
  isRendering?: boolean;
  renderProgress?: number;
  renderEtaSeconds?: number | null;
  handleRenderFinalVideo?: () => void;
  audioFeedback?: any;
}

const AppWorkspaceInner = ({
  isDashboardOnly = true,
  projectId,
  panels,
  setPanels,
  consoleLogs,
  setConsoleLogs,
  scrapedImages,
  setScrapedImages,
  selectedScraped,
  setSelectedScraped,
  activePreviewTab,
  setActivePreviewTab,
  setEditingImageIdx,
  setEditCropTop,
  setEditCropBottom,
  setEditCropLeft,
  setEditCropRight,
  setEditAutoTrim,
  showBubbleModal,
  setShowBubbleModal,
  playStoryboardAudio,
  isCleaningBubbles,
  cleanProgress,
  bubbleCroppingImgUrl,
  showAutoCropModal,
  setShowAutoCropModal,
  isBatchCropping,
  batchProgress,
  croppingImgUrl,
  handleAutoCropSelected,
  handleCleanBubblesSelected,
  handleCancelBatch,
  videoPlayerRef,
  addNotification,
  setErrorPopup,
  fetchWithInterceptor,
  targetUrl,
  setTargetUrl,
  selectedSource,
  setSelectedSource,
  selectedModel,
  setSelectedModel,
  isProcessing,
  handleGenerateVideo,
  isScraping,
  scrapeImages,
  mergingIndices,
  handleStitchWithNext,
  addPanelsToStoryboard,
  progressStatus,
  videoUrl,
  setVideoUrl,
  aspectRatio,
  currentPanelIndex,
  setCurrentPanelIndex,
  playbackTime,
  setPlaybackTime,
  reprocessingPanelId,
  storyboardPlaying,
  toggleStoryboardPlayback,
  resetStoryboardPlayback,
  isMuted,
  setIsMuted,
  volume,
  setVolume,
  musicTheme,
  voiceActor,
  narrationStyle,
  setNarrationStyle,
  bubbleSensitivity,
  bubbleDetectionStyle,
  bubbleEraseMethod,
  bubbleDilation,
  bubbleInpaintRadius,
  cropSensitivity,
  cropBackgroundMode,
  aspectRatioLock,
  minPanelAreaPct,
  overlapMergeThreshold,
  useLocalCV,
  autoSplitTallStrips,
  cropModel,
  cropMinHeightPx,
  cropCannyLow,
  cropCannyHigh,
  cropCloseKernelSize,
  seriesTitle,
  setSeriesTitle,
  chapterNumber,
  setChapterNumber,
  chapterTitle,
  setChapterTitle,
  scrapedGenre,
  setScrapedGenre,
  seriesAuthor,
  setSeriesAuthor,
  seriesCoverImage,
  setSeriesCoverImage,
  seriesSynopsis,
  setSeriesSynopsis,
  smartSlice,
  setSmartSlice,
  showScrapeConfirmModal,
  setShowScrapeConfirmModal,
  saveProject,
  isGeneratingStoryboard = false,
  handleGenerateStoryboardAI,
  resetWorkspace,
  isRendering = false,
  renderProgress = 0,
  renderEtaSeconds = null,
  handleRenderFinalVideo,
  audioFeedback,
}: AppWorkspaceProps) => {
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("autoScrape") === "true" && targetUrl) {
      // Remove autoScrape so it doesn't loop on refresh
      params.delete("autoScrape");
      window.history.replaceState(
        {},
        "",
        `${window.location.pathname}?${params.toString()}`
      );

      const token =
        localStorage.getItem("sonikoma_token") ||
        sessionStorage.getItem("sonikoma_token");

      if (!token) {
        const usedFree = localStorage.getItem("sonikoma_free_scrape_used");
        if (usedFree === "true") {
          addNotification(
            "You've used your free try. Please sign in to import more links!",
            "warning"
          );
          if (typeof (window as any).navigateTo === "function") {
            (window as any).navigateTo("/login");
          } else {
            window.history.pushState({}, "", "/login");
            window.dispatchEvent(new Event("popstate"));
          }
          return;
        } else {
          localStorage.setItem("sonikoma_free_scrape_used", "true");
        }
      }
      setShowScrapeConfirmModal(true);
    }
  }, [targetUrl]);

  const handleConfirmProjectAndScrape = async (
    details: {
      seriesTitle: string;
      chapterNumber: string;
      chapterTitle: string;
      scrapedGenre: string;
      seriesAuthor: string;
      seriesCoverImage: string;
      seriesSynopsis: string;
    },
    isTemporary?: boolean
  ) => {
    setShowScrapeConfirmModal(false);

    // Update parent states
    setSeriesTitle(details.seriesTitle);
    setChapterNumber(details.chapterNumber);
    setChapterTitle(details.chapterTitle);
    setScrapedGenre(details.scrapedGenre);
    setSeriesAuthor(details.seriesAuthor);
    setSeriesCoverImage(details.seriesCoverImage);
    setSeriesSynopsis(details.seriesSynopsis);

    // Generate project_id
    const generatedProjectId =
      (isTemporary ? "temp_" : "proj_") +
      Date.now() +
      "_" +
      Math.random().toString(36).substring(2, 10);

    try {
      const formattedEpisode = (() => {
        const num = details.chapterNumber.trim();
        const name = details.chapterTitle.trim();
        if (num && name) return `Chapter ${num} - ${name}`;
        if (num) return `Chapter ${num}`;
        if (name) return name;
        return "";
      })();

      const logMsg = isTemporary
        ? "Initializing temporary preview session (no data will be saved)..."
        : `Initializing workspace for "${details.seriesTitle}"...`;
      addNotification(logMsg, "info");

      if (!isTemporary) {
        // Clear query parameters when moving into a managed project
        window.history.pushState(null, "", "/workspace");
      }

      // Start the actual scrape
      await scrapeImages(targetUrl, generatedProjectId);
    } catch (err: any) {
      console.error(err);
      addNotification(
        `Failed to create project: ${err.message || "Unknown error"}`,
        "error"
      );
    }
  };

  const handleSaveMeta = async () => {
    if (saveProject) {
      await saveProject(undefined, {
        savingMessage: "Saving metadata...",
        successMessage: "Metadata saved successfully!",
        errorMessage: "Failed to save metadata.",
      });
    }
  };

  const handleSaveAssets = async () => {
    if (projectId?.startsWith("temp_")) {
      addNotification(
        "Temporary Session: Saving images is disabled.",
        "warning"
      );
      return;
    }
    const token =
      localStorage.getItem("sonikoma_token") ||
      sessionStorage.getItem("sonikoma_token");
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    try {
      addNotification("Saving images...", "info");
      const data = await api.saveScrapedImages(
        {
          url: targetUrl,
          images: scrapedImages,
        },
        token || undefined
      );
      if (data) {
        addNotification("Images saved successfully!", "success");
      } else {
        throw new Error("Failed to save images");
      }
    } catch (err: any) {
      addNotification(`Failed to save images: ${err.message}`, "error");
    }
  };

  const handleSaveStoryboard = async () => {
    if (saveProject) {
      await saveProject(panels, {
        savingMessage: "Saving timeline...",
        successMessage: "Timeline saved successfully!",
        errorMessage: "Failed to save timeline.",
      });
    }
  };

  const handleSaveVideo = async () => {
    if (saveProject) {
      await saveProject(undefined, {
        savingMessage: "Saving video...",
        successMessage: "Video saved successfully!",
        errorMessage: "Failed to save video.",
      });
    }
  };

  return (
    <main
      id="main_workspace"
      className="flex-1 w-full max-w-2xl mx-auto px-4 sm:px-6 py-6 md:py-10 flex flex-col gap-6 justify-center"
    >
      {/* CONVERSION INPUT CARD */}
      <UrlInputPanel
        targetUrl={targetUrl}
        setTargetUrl={setTargetUrl}
        selectedSource={selectedSource}
        setSelectedSource={setSelectedSource}
        selectedModel={selectedModel}
        setSelectedModel={setSelectedModel}
        isProcessing={isProcessing}
        isScraping={isScraping}
        handleGenerateVideo={handleGenerateVideo}
        handleScrape={() => {
          const token =
            localStorage.getItem("sonikoma_token") ||
            sessionStorage.getItem("sonikoma_token");
          if (!token) {
            const usedFree = localStorage.getItem(
              "sonikoma_free_scrape_used"
            );
            if (usedFree === "true") {
              addNotification(
                "You've used your free try. Please sign in to import more links!",
                "warning"
              );
              if (typeof (window as any).navigateTo === "function") {
                (window as any).navigateTo("/login");
              } else {
                window.history.pushState({}, "", "/login");
                window.dispatchEvent(new Event("popstate"));
              }
              return;
            } else {
              localStorage.setItem("sonikoma_free_scrape_used", "true");
            }
          }
          setShowScrapeConfirmModal(true);
        }}
        addNotification={addNotification}
        narrationStyle={narrationStyle}
        setNarrationStyle={setNarrationStyle}
        seriesTitle={seriesTitle}
        setSeriesTitle={setSeriesTitle}
        chapterNumber={chapterNumber}
        setChapterNumber={setChapterNumber}
        chapterTitle={chapterTitle}
        setChapterTitle={setChapterTitle}
        scrapedGenre={scrapedGenre}
        setScrapedGenre={setScrapedGenre}
        seriesAuthor={seriesAuthor}
        setSeriesAuthor={setSeriesAuthor}
        seriesCoverImage={seriesCoverImage}
        setSeriesCoverImage={setSeriesCoverImage}
        seriesSynopsis={seriesSynopsis}
        setSeriesSynopsis={setSeriesSynopsis}
        smartSlice={smartSlice}
        setSmartSlice={setSmartSlice}
        resetWorkspace={resetWorkspace}
        handleSaveMeta={handleSaveMeta}
      />

      <ProjectConfirmModal
        isOpen={showScrapeConfirmModal}
        onClose={() => setShowScrapeConfirmModal(false)}
        onConfirm={handleConfirmProjectAndScrape}
        initialDetails={{
          seriesTitle,
          chapterNumber,
          chapterTitle,
          scrapedGenre,
          seriesAuthor,
          seriesCoverImage,
          seriesSynopsis,
        }}
      />
    </main>
  );
}

const AppWorkspace = React.memo(AppWorkspaceInner);
export default AppWorkspace;
