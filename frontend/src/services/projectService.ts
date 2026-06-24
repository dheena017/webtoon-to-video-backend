import { useProjectStore } from "../store/useProjectStore";
import { useEditorStore } from "../store/useEditorStore";
import { useNotificationStore } from "../store/useNotificationStore";
import { fetchWithInterceptor } from "./authService";
import { extractWebtoonUrl, parseWebtoonUrl } from "../utils/url";

const SOURCE_DOMAINS: Record<string, string[]> = {
  webtoons: ["webtoons.com", "webtoon.com"],
  custom: [],
};

export const scrapeImages = async (
  customUrl?: any,
  overrideProjectId?: string
) => {
  const projState = useProjectStore.getState();
  const editState = useEditorStore.getState();
  const notifState = useNotificationStore.getState();

  const activeUrl =
    typeof customUrl === "string" ? customUrl : projState.targetUrl;
  if (!activeUrl || !activeUrl.trim()) return;

  const normalizedTargetUrl = extractWebtoonUrl(activeUrl);
  const currentHost = (() => {
    try {
      const urlWithScheme = normalizedTargetUrl.startsWith("http")
        ? normalizedTargetUrl
        : `https://${normalizedTargetUrl}`;
      return new URL(urlWithScheme).hostname.toLowerCase();
    } catch {
      return "";
    }
  })();

  const allowedHosts = SOURCE_DOMAINS[editState.selectedSource] || [];
  const isDirectImage = Boolean(
    normalizedTargetUrl &&
      (normalizedTargetUrl
        .toLowerCase()
        .match(/\.(png|jpg|jpeg|webp|gif|svg|bmp|tiff)(\?|$)/) ||
        normalizedTargetUrl.startsWith("data:image/"))
  );

  const isSourceMismatch = Boolean(
    normalizedTargetUrl &&
      !isDirectImage &&
      editState.selectedSource !== "custom" &&
      currentHost &&
      !allowedHosts.some(
        (allowedHost) =>
          currentHost === allowedHost || currentHost.endsWith(`.${allowedHost}`)
      )
  );

  if (isSourceMismatch) {
    notifState.addNotification(
      `Selected source ${editState.selectedSource} does not match the current URL host (${currentHost}).`,
      "error"
    );
    projState.setPanels([]);
    projState.setScrapedImages([]);
    projState.setSelectedScraped([]);
    projState.setIsScraping(false);
    return;
  }

  projState.setIsScraping(true);
  const { genre, title, episode } = parseWebtoonUrl(normalizedTargetUrl);

  if (title) {
    projState.setScrapedTitle(
      title
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ")
    );
  }
  if (genre) {
    projState.setScrapedGenre(
      genre
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ")
    );
  }

  projState.setPanels([]);
  projState.setScrapedImages([]);
  projState.setSelectedScraped([]);

  try {
    const formattedEpisode = (() => {
      const num = projState.chapterNumber.trim();
      const name = projState.chapterTitle.trim();
      if (num && name) return `Chapter ${num} - ${name}`;
      if (num) return `Chapter ${num}`;
      if (name) return name;
      return "";
    })();

    const res = await fetchWithInterceptor("/api/scrape-images", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url: normalizedTargetUrl,
        model: editState.selectedModel,
        source: editState.selectedSource,
        bypass_cache: false,
        smart_slice: editState.smartSlice,
        title: projState.seriesTitle ? projState.seriesTitle.trim() : undefined,
        episode: formattedEpisode || undefined,
        genre: projState.scrapedGenre
          ? projState.scrapedGenre.trim()
          : undefined,
        author: projState.seriesAuthor
          ? projState.seriesAuthor.trim()
          : undefined,
        cover_image: projState.seriesCoverImage
          ? projState.seriesCoverImage.trim()
          : undefined,
        synopsis: projState.seriesSynopsis
          ? projState.seriesSynopsis.trim()
          : undefined,
        project_id: overrideProjectId || undefined,
        scrape_only: editState.smartSlice,
      }),
    });
    const data = await res.json();

    if (data.success && data.images && data.images.length > 0) {
      const finalImages = data.images.map((img: string) =>
        img.startsWith("http") && !img.includes("/api/")
          ? `/api/proxy-image?url=${encodeURIComponent(img)}`
          : img
      );

      projState.setScrapedImages(finalImages);
      if (data.project_id) {
        projState.setProjectId(data.project_id);
      }

      if (data.panels && data.panels.length > 0) {
        const mappedPanels = data.panels.map((p: any) => ({
          ...p,
          grayscale: p.grayscale === 1 || p.grayscale === true,
        }));
        projState.setPanels(mappedPanels);
      }

      if (data.cover_image) projState.setSeriesCoverImage(data.cover_image);
      if (data.title) {
        projState.setSeriesTitle(data.title);
        projState.setScrapedTitle(data.title);
      }
      if (data.author) projState.setSeriesAuthor(data.author);
      if (data.synopsis) projState.setSeriesSynopsis(data.synopsis);
      if (data.genre) projState.setScrapedGenre(data.genre);

      if (data.episode) {
        const epMatch = data.episode.match(
          /^Chapter\s+(\d+)(?:\s+-\s+(.+))?$/i
        );
        if (epMatch) {
          projState.setChapterNumber(epMatch[1]);
          projState.setChapterTitle(epMatch[2] || "");
        }
      }

      projState.setIsScraping(false);
    } else {
      projState.setIsScraping(false);
      notifState.addNotification(`Failed to find comic panels.`, "error");
    }
  } catch (err: any) {
    projState.setIsScraping(false);
    notifState.addNotification(
      `Service unable to access target site.`,
      "error"
    );
  }
};
