// ============================================================================
// WorkspaceEditPage.tsx — Sonikoma Workspace Edit
// Full editorial workspace: sidebar, top navbar, canvas, properties, status bar
// ============================================================================

import React, { useState, useCallback, useRef, useEffect } from "react";
import WorkspaceTimeline from "./workspace/WorkspaceTimeline";
import {
  Layers,
  ImageIcon,
  Clock,
  StickyNote,
  Settings2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Save,
  Download,
  Undo2,
  Redo2,
  Eye,
  Share2,
  Plus,
  Minus,
  Maximize2,
  Grid3x3,
  AlignLeft,
  LayoutTemplate,
  Sliders,
  Palette,
  Type,
  Move,
  Crop,
  Wand2,
  Film,
  Music,
  Mic,
  BarChart2,
  Search,
  X,
  MoreHorizontal,
  CheckCircle2,
  Circle,
  Loader2,
  Sparkles,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  RotateCw,
  Copy,
  Trash2,
  Lock,
  Unlock,
  EyeOff,
  GripVertical,
  Paintbrush,
  Eraser,
  Scissors,
  Globe,
  Info,
  ArrowLeft,
  MousePointer2,
  Square,
  Triangle,
  Circle as CircleIcon,
  Pen,
  FileText,
} from "lucide-react";
import { useThemeMode } from "../hooks/useThemeMode";

// ============================================================================
// TYPES
// ============================================================================

type ToolId =
  | "select"
  | "move"
  | "crop"
  | "pen"
  | "eraser"
  | "paint"
  | "text"
  | "shape"
  | "zoom";

type MainTab = "panels" | "autocrop" | "bubblecleaner" | "editor" | "metadata" | "timeline" | "settings";

type SidebarSection = "layers" | "assets" | "history" | "notes" | "properties";

interface Layer {
  id: string;
  name: string;
  visible: boolean;
  locked: boolean;
  type: "image" | "text" | "shape" | "adjustment";
  opacity: number;
}

interface HistoryEntry {
  id: string;
  action: string;
  timestamp: string;
  icon: React.ElementType;
}

// ============================================================================
// MOCK DATA
// ============================================================================

const MOCK_LAYERS: Layer[] = [
  { id: "l1", name: "Panel Frame #1", visible: true, locked: false, type: "image", opacity: 100 },
  { id: "l2", name: "Speech Bubble", visible: true, locked: false, type: "shape", opacity: 100 },
  { id: "l3", name: "Dialogue Text", visible: true, locked: false, type: "text", opacity: 100 },
  { id: "l4", name: "Background Art", visible: true, locked: true, type: "image", opacity: 85 },
  { id: "l5", name: "Color Grading", visible: true, locked: false, type: "adjustment", opacity: 60 },
  { id: "l6", name: "Panel Frame #2", visible: false, locked: false, type: "image", opacity: 100 },
];

const MOCK_HISTORY: HistoryEntry[] = [
  { id: "h1", action: "Crop applied to Panel #3", timestamp: "2m ago", icon: Crop },
  { id: "h2", action: "Bubble erased on Page 1", timestamp: "5m ago", icon: Eraser },
  { id: "h3", action: "Text layer added", timestamp: "8m ago", icon: Type },
  { id: "h4", action: "Image imported (12 panels)", timestamp: "12m ago", icon: ImageIcon },
  { id: "h5", action: "Project opened", timestamp: "15m ago", icon: FileText },
];

const PANELS_MOCK = Array.from({ length: 6 }, (_, i) => ({
  id: `panel-${i + 1}`,
  title: `Panel ${i + 1}`,
  duration: `${(Math.random() * 4 + 1).toFixed(1)}s`,
  status: i < 4 ? "ready" : i === 4 ? "processing" : "pending",
  hasAudio: i < 3,
  hasBubbles: i % 2 === 0,
}));

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

/** Left sidebar tool icon button */
function ToolButton({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      className={`relative group w-9 h-9 flex items-center justify-center rounded-xl transition-all duration-200 cursor-pointer ${
        active
          ? "bg-purple-600/30 text-purple-300 shadow-[0_0_10px_rgba(168,85,247,0.3)] border border-purple-700/50"
          : "text-neutral-500 hover:text-neutral-200 hover:bg-neutral-800 border border-transparent"
      }`}
    >
      <Icon className="h-4 w-4" />
      <span className="absolute left-full ml-2.5 px-2 py-1 bg-neutral-900 border border-neutral-800 rounded-lg text-[10px] font-mono text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-[200] shadow-xl">
        {label}
      </span>
    </button>
  );
}

/** Layer item row */
function LayerItem({
  layer,
  selected,
  onSelect,
  onToggleVisible,
  onToggleLock,
}: {
  layer: Layer;
  selected: boolean;
  onSelect: () => void;
  onToggleVisible: () => void;
  onToggleLock: () => void;
}) {
  const typeColor = {
    image: "text-sky-400",
    text: "text-amber-400",
    shape: "text-emerald-400",
    adjustment: "text-purple-400",
  }[layer.type];

  const TypeIcon = {
    image: ImageIcon,
    text: Type,
    shape: Square,
    adjustment: Sliders,
  }[layer.type];

  return (
    <div
      onClick={onSelect}
      className={`flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer group transition-all duration-150 ${
        selected
          ? "bg-purple-900/30 border border-purple-800/50"
          : "hover:bg-neutral-800/50 border border-transparent"
      }`}
    >
      <GripVertical className="h-3 w-3 text-neutral-600 flex-shrink-0 opacity-0 group-hover:opacity-100" />
      <TypeIcon className={`h-3 w-3 flex-shrink-0 ${typeColor}`} />
      <span
        className={`flex-1 text-[11px] font-mono truncate ${
          layer.visible ? "text-neutral-200" : "text-neutral-600 line-through"
        }`}
      >
        {layer.name}
      </span>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={(e) => { e.stopPropagation(); onToggleLock(); }}
          className="p-0.5 rounded text-neutral-500 hover:text-neutral-200 cursor-pointer"
        >
          {layer.locked ? <Lock className="h-2.5 w-2.5" /> : <Unlock className="h-2.5 w-2.5" />}
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onToggleVisible(); }}
          className="p-0.5 rounded text-neutral-500 hover:text-neutral-200 cursor-pointer"
        >
          {layer.visible ? <Eye className="h-2.5 w-2.5" /> : <EyeOff className="h-2.5 w-2.5" />}
        </button>
      </div>
    </div>
  );
}

/** Panel card in main canvas */
function PanelCard({
  panel,
  selected,
  onSelect,
}: {
  panel: (typeof PANELS_MOCK)[0];
  selected: boolean;
  onSelect: () => void;
}) {
  const statusColor = {
    ready: "text-emerald-400 bg-emerald-950/50 border-emerald-800/50",
    processing: "text-amber-400 bg-amber-950/50 border-amber-800/50",
    pending: "text-neutral-500 bg-neutral-900/50 border-neutral-800/50",
  }[panel.status];

  return (
    <div
      onClick={onSelect}
      className={`group relative flex flex-col rounded-2xl border cursor-pointer transition-all duration-200 overflow-hidden ${
        selected
          ? "border-purple-600/70 shadow-[0_0_20px_rgba(168,85,247,0.25)] bg-neutral-900"
          : "border-neutral-800/60 bg-neutral-900/60 hover:border-neutral-700 hover:bg-neutral-900"
      }`}
    >
      {/* Panel image placeholder */}
      <div className="relative aspect-[9/12] bg-gradient-to-br from-neutral-800 to-neutral-900 flex items-center justify-center overflow-hidden">
        {/* Simulated manga panel art */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-4 left-4 right-4 h-1/3 bg-neutral-700/60 rounded-lg" />
          <div className="absolute top-1/2 left-4 right-20 h-1/4 bg-neutral-700/40 rounded-lg" />
          <div className="absolute bottom-8 left-4 right-4 h-1/5 bg-neutral-700/50 rounded-lg" />
        </div>
        <div className="relative z-10 flex flex-col items-center gap-2">
          <Film className="h-6 w-6 text-neutral-600" />
          <span className="text-[10px] font-mono text-neutral-600">{panel.title}</span>
        </div>

        {/* Processing overlay */}
        {panel.status === "processing" && (
          <div className="absolute inset-0 bg-amber-950/30 flex items-center justify-center">
            <Loader2 className="h-6 w-6 text-amber-400 animate-spin" />
          </div>
        )}

        {/* Selected ring */}
        {selected && (
          <div className="absolute inset-0 border-2 border-purple-500 rounded-inherit pointer-events-none" />
        )}

        {/* Panel index badge */}
        <div className="absolute top-2 left-2 px-1.5 py-0.5 bg-black/60 rounded font-mono text-[9px] text-neutral-300 backdrop-blur-sm">
          #{PANELS_MOCK.indexOf(panel) + 1}
        </div>

        {/* Indicators */}
        <div className="absolute bottom-2 right-2 flex items-center gap-1">
          {panel.hasAudio && (
            <span className="w-4 h-4 rounded-full bg-sky-900/70 border border-sky-700/50 flex items-center justify-center">
              <Mic className="h-2 w-2 text-sky-400" />
            </span>
          )}
          {panel.hasBubbles && (
            <span className="w-4 h-4 rounded-full bg-rose-900/70 border border-rose-700/50 flex items-center justify-center">
              <Eraser className="h-2 w-2 text-rose-400" />
            </span>
          )}
        </div>
      </div>

      {/* Panel footer */}
      <div className="px-3 py-2 flex items-center justify-between">
        <span className="text-[10px] font-bold font-mono text-neutral-300">{panel.title}</span>
        <div className="flex items-center gap-1.5">
          <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${statusColor}`}>
            {panel.status}
          </span>
          <span className="text-[9px] font-mono text-neutral-500">{panel.duration}</span>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

interface WorkspaceEditPageProps {
  onNavigateHome?: () => void;
  navigateTo?: (path: string) => void;
}

export default function WorkspaceEditPage({
  onNavigateHome,
  navigateTo,
}: WorkspaceEditPageProps) {
  const { themeMode } = useThemeMode();

  // --- Left sidebar state ---
  const [leftSidebarExpanded, setLeftSidebarExpanded] = useState(true);
  const [activeSection, setActiveSection] = useState<SidebarSection>("layers");

  // --- Right panel state ---
  const [rightPanelOpen, setRightPanelOpen] = useState(true);

  // --- Tool state ---
  const [activeTool, setActiveTool] = useState<ToolId>("select");

  // --- Main tab state ---
  const [activeTab, setActiveTab] = useState<MainTab>("panels");

  // Sync tab with URL query parameter
  useEffect(() => {
    const syncTabFromUrl = () => {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get("tab") as MainTab;
      const validTabs: MainTab[] = ["panels", "autocrop", "bubblecleaner", "editor", "metadata", "timeline", "settings"];
      if (tabParam && validTabs.includes(tabParam)) {
        setActiveTab(tabParam);
      }
    };
    syncTabFromUrl();
    window.addEventListener("popstate", syncTabFromUrl);
    return () => window.removeEventListener("popstate", syncTabFromUrl);
  }, []);

  const handleTabChange = (tab: MainTab) => {
    setActiveTab(tab);
    const url = new URL(window.location.href);
    url.searchParams.set("tab", tab);
    window.history.pushState({}, "", url.toString());
  };

  // --- Zoom state ---
  const [zoom, setZoom] = useState(100);

  // --- Selection state ---
  const [selectedPanelId, setSelectedPanelId] = useState<string | null>(null);
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>("l1");

  // --- Layers state ---
  const [layers, setLayers] = useState<Layer[]>(MOCK_LAYERS);

  // --- Notes state ---
  const [notes, setNotes] = useState(
    "Add production notes here...\n\nChapter 3 - Scene 2:\n- Ensure speech bubbles are cleaned\n- Voice actor: Kenji\n- Music: Epic cinematic"
  );

  // --- History state ---
  const [canUndo] = useState(true);
  const [canRedo] = useState(false);

  // --- Save status ---
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "unsaved">("saved");

  // --- Search ---
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const handleSave = useCallback(() => {
    setSaveStatus("saving");
    setTimeout(() => setSaveStatus("saved"), 1200);
  }, []);

  const handleZoomIn = () => setZoom((z) => Math.min(z + 10, 200));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 10, 25));
  const handleZoomReset = () => setZoom(100);

  const toggleLayer = (id: string, field: "visible" | "locked") => {
    setLayers((prev) =>
      prev.map((l) => (l.id === id ? { ...l, [field]: !l[field] } : l))
    );
  };

  const selectedPanel = PANELS_MOCK.find((p) => p.id === selectedPanelId);
  const selectedLayer = layers.find((l) => l.id === selectedLayerId);

  // ─── LEFT SIDEBAR SECTION CONTENT ────────────────────────────
  const renderSectionContent = () => {
    switch (activeSection) {
      case "layers":
        return (
          <div className="space-y-1">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-black uppercase tracking-widest text-neutral-500 font-mono">
                Layers
              </span>
              <div className="flex items-center gap-1">
                <button className="p-1 rounded-lg hover:bg-neutral-800 text-neutral-500 hover:text-white transition-colors cursor-pointer">
                  <Plus className="h-3 w-3" />
                </button>
                <button className="p-1 rounded-lg hover:bg-neutral-800 text-neutral-500 hover:text-white transition-colors cursor-pointer">
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            </div>
            {layers.map((layer) => (
              <LayerItem
                key={layer.id}
                layer={layer}
                selected={selectedLayerId === layer.id}
                onSelect={() => setSelectedLayerId(layer.id)}
                onToggleVisible={() => toggleLayer(layer.id, "visible")}
                onToggleLock={() => toggleLayer(layer.id, "locked")}
              />
            ))}
          </div>
        );

      case "assets":
        return (
          <div className="space-y-3">
            <span className="text-[10px] font-black uppercase tracking-widest text-neutral-500 font-mono block">
              Assets Library
            </span>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-neutral-500" />
              <input
                type="text"
                placeholder="Search assets..."
                className="w-full pl-8 pr-3 py-1.5 bg-neutral-800/60 border border-neutral-700/50 rounded-lg text-[11px] font-mono text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-purple-600/50"
              />
            </div>
            <div className="space-y-2">
              {["Backgrounds", "Characters", "Effects", "Fonts", "Audio"].map((cat) => (
                <button
                  key={cat}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-neutral-800/40 hover:bg-neutral-800 border border-neutral-800/60 hover:border-neutral-700 text-[11px] font-mono text-neutral-400 hover:text-white transition-all cursor-pointer"
                >
                  <span>{cat}</span>
                  <ChevronRight className="h-3 w-3" />
                </button>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-1.5 pt-1">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="aspect-square rounded-lg bg-neutral-800/60 border border-neutral-700/40 hover:border-purple-700/50 cursor-pointer transition-all group relative overflow-hidden"
                >
                  <div className="absolute inset-0 flex items-center justify-center">
                    <ImageIcon className="h-4 w-4 text-neutral-600 group-hover:text-neutral-400" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case "history":
        return (
          <div className="space-y-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-neutral-500 font-mono block mb-3">
              History
            </span>
            {MOCK_HISTORY.map((entry, i) => {
              const Icon = entry.icon;
              return (
                <button
                  key={entry.id}
                  className={`w-full flex items-start gap-2.5 p-2 rounded-xl text-left cursor-pointer transition-all group ${
                    i === 0
                      ? "bg-purple-900/20 border border-purple-800/40"
                      : "hover:bg-neutral-800/50 border border-transparent"
                  }`}
                >
                  <div
                    className={`mt-0.5 p-1 rounded-lg flex-shrink-0 ${
                      i === 0 ? "bg-purple-800/40" : "bg-neutral-800"
                    }`}
                  >
                    <Icon className={`h-3 w-3 ${i === 0 ? "text-purple-300" : "text-neutral-500"}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-[11px] font-mono leading-tight ${i === 0 ? "text-neutral-200" : "text-neutral-400"}`}>
                      {entry.action}
                    </p>
                    <p className="text-[9px] text-neutral-600 font-mono mt-0.5">{entry.timestamp}</p>
                  </div>
                </button>
              );
            })}
          </div>
        );

      case "notes":
        return (
          <div className="space-y-3 h-full flex flex-col">
            <span className="text-[10px] font-black uppercase tracking-widest text-neutral-500 font-mono block">
              Production Notes
            </span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="flex-1 w-full min-h-[300px] bg-neutral-900/60 border border-neutral-800/60 rounded-xl p-3 text-[11px] font-mono text-neutral-300 placeholder-neutral-600 focus:outline-none focus:border-purple-600/40 resize-none leading-relaxed"
              placeholder="Add production notes..."
            />
            <button className="w-full py-2 rounded-xl bg-purple-900/30 border border-purple-800/40 text-purple-300 text-[11px] font-mono hover:bg-purple-900/50 transition-colors cursor-pointer">
              Save Notes
            </button>
          </div>
        );

      case "properties":
        return (
          <div className="space-y-4">
            <span className="text-[10px] font-black uppercase tracking-widest text-neutral-500 font-mono block">
              Properties
            </span>
            {selectedLayer ? (
              <>
                <div className="p-3 bg-neutral-900/60 rounded-xl border border-neutral-800/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono text-neutral-400">Name</span>
                    <span className="text-[11px] font-mono text-white">{selectedLayer.name}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono text-neutral-400">Type</span>
                    <span className="text-[11px] font-mono text-purple-300 capitalize">{selectedLayer.type}</span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-mono text-neutral-400">Opacity</span>
                      <span className="text-[11px] font-mono text-white">{selectedLayer.opacity}%</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={selectedLayer.opacity}
                      onChange={(e) =>
                        setLayers((prev) =>
                          prev.map((l) =>
                            l.id === selectedLayerId
                              ? { ...l, opacity: Number(e.target.value) }
                              : l
                          )
                        )
                      }
                      className="w-full h-1.5 rounded-full accent-purple-500 cursor-pointer"
                    />
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-neutral-600">
                <Layers className="h-6 w-6 mb-2" />
                <p className="text-[11px] font-mono text-center">Select a layer to view its properties</p>
              </div>
            )}
          </div>
        );
    }
  };

  // ─── LEFT SIDEBAR SECTIONS ────────────────────────────────────
  const SIDEBAR_SECTIONS: { id: SidebarSection; icon: React.ElementType; label: string }[] = [
    { id: "layers", icon: Layers, label: "Layers" },
    { id: "assets", icon: ImageIcon, label: "Assets" },
    { id: "history", icon: Clock, label: "History" },
    { id: "notes", icon: StickyNote, label: "Notes" },
    { id: "properties", icon: Settings2, label: "Properties" },
  ];

  // ─── EDITING TOOLS ────────────────────────────────────────────
  const TOOLS: { id: ToolId; icon: React.ElementType; label: string }[] = [
    { id: "select", icon: MousePointer2, label: "Select (V)" },
    { id: "move", icon: Move, label: "Move (M)" },
    { id: "crop", icon: Crop, label: "Crop (C)" },
    { id: "pen", icon: Pen, label: "Pen (P)" },
    { id: "eraser", icon: Eraser, label: "Eraser (E)" },
    { id: "paint", icon: Paintbrush, label: "Paint (B)" },
    { id: "text", icon: Type, label: "Text (T)" },
    { id: "shape", icon: Square, label: "Shape (S)" },
    { id: "zoom", icon: ZoomIn, label: "Zoom (Z)" },
  ];

  // ─── MAIN TAB CONTENT ─────────────────────────────────────────
  const renderMainContent = () => {
    switch (activeTab) {
      case "panels":
        return (
          <div
            className="flex-1 overflow-y-auto p-6"
            style={{ transform: `scale(${zoom / 100})`, transformOrigin: "top center" }}
          >
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {PANELS_MOCK.map((panel) => (
                <PanelCard
                  key={panel.id}
                  panel={panel}
                  selected={selectedPanelId === panel.id}
                  onSelect={() => setSelectedPanelId(selectedPanelId === panel.id ? null : panel.id)}
                />
              ))}
              {/* Add panel button */}
              <button className="aspect-[9/14] rounded-2xl border-2 border-dashed border-neutral-800 hover:border-purple-700/50 flex flex-col items-center justify-center gap-2 text-neutral-600 hover:text-purple-400 transition-all cursor-pointer group">
                <div className="w-10 h-10 rounded-full bg-neutral-800/60 group-hover:bg-purple-900/30 flex items-center justify-center transition-colors">
                  <Plus className="h-5 w-5" />
                </div>
                <span className="text-[10px] font-mono">Add Panel</span>
              </button>
            </div>
          </div>
        );
      case "autocrop":
        return (
          <div className="flex-1 flex flex-col lg:flex-row gap-6 p-6 min-h-0 overflow-y-auto">
            {/* Auto-Crop Settings Panel */}
            <div className="w-full lg:w-80 flex-shrink-0 bg-neutral-900/60 border border-neutral-800/60 rounded-2xl p-5 space-y-5">
              <div>
                <h3 className="text-sm font-bold font-mono text-white flex items-center gap-2">
                  <Scissors className="h-4 w-4 text-purple-400" />
                  Auto-Crop Settings
                </h3>
                <p className="text-[10px] font-mono text-neutral-500 mt-1">
                  Adjust parameters for automated panel boundary detection
                </p>
              </div>

              {/* Sliders */}
              <div className="space-y-4">
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-neutral-400">Detection Sensitivity</span>
                    <span className="text-purple-400 font-bold">85%</span>
                  </div>
                  <input type="range" min={1} max={100} defaultValue={85} className="w-full h-1.5 accent-purple-500 cursor-pointer" />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-neutral-400">Panel Margin Padding</span>
                    <span className="text-purple-400 font-bold">12 px</span>
                  </div>
                  <input type="range" min={0} max={50} defaultValue={12} className="w-full h-1.5 accent-purple-500 cursor-pointer" />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-neutral-400">Min Panel Area (Pct)</span>
                    <span className="text-purple-400 font-bold">8%</span>
                  </div>
                  <input type="range" min={1} max={30} defaultValue={8} className="w-full h-1.5 accent-purple-500 cursor-pointer" />
                </div>
              </div>

              {/* Options */}
              <div className="space-y-3 pt-2 border-t border-neutral-800/40">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-neutral-500 font-mono">
                    Aspect Ratio Lock
                  </label>
                  <select className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs font-mono text-neutral-300 focus:outline-none focus:border-purple-600/40">
                    <option>Free Form (Detected Boundaries)</option>
                    <option>9:16 Locked</option>
                    <option>16:9 Locked</option>
                    <option>1:1 Square</option>
                  </select>
                </div>

                <div className="space-y-2 pt-2">
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-xs font-mono text-neutral-400">Auto-split tall strips</span>
                    <div className="w-8 h-4 rounded-full bg-purple-600 flex items-center p-0.5">
                      <div className="w-3 h-3 rounded-full bg-white translate-x-4" />
                    </div>
                  </label>
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-xs font-mono text-neutral-400">Use local CV processing</span>
                    <div className="w-8 h-4 rounded-full bg-neutral-700 flex items-center p-0.5">
                      <div className="w-3 h-3 rounded-full bg-white translate-x-0" />
                    </div>
                  </label>
                </div>
              </div>

              <button className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-mono text-xs font-bold transition-all shadow-[0_0_15px_rgba(168,85,247,0.35)] cursor-pointer flex items-center justify-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5" />
                Run Panel Detection
              </button>
            </div>

            {/* Manga strips preview panel */}
            <div className="flex-1 bg-neutral-900/40 border border-neutral-800/50 rounded-2xl p-5 flex flex-col justify-between">
              <div className="flex items-center justify-between pb-3 border-b border-neutral-800/40 mb-4">
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-white font-mono">
                    Detection Canvas
                  </h4>
                  <p className="text-[10px] font-mono text-neutral-500 mt-0.5">
                    Visual preview of auto-detected panels boundary boxes
                  </p>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 bg-purple-950/40 border border-purple-800/60 rounded text-purple-300">
                  4 Bounding Boxes Found
                </span>
              </div>

              {/* Simulated Comic Strip */}
              <div className="flex-1 bg-neutral-950 border border-neutral-800 rounded-xl flex items-center justify-center p-8 overflow-hidden relative">
                {/* Manga page representation with borders */}
                <div className="w-64 aspect-[9/16] bg-neutral-900 rounded-lg relative overflow-hidden p-3 flex flex-col gap-3 shadow-2xl">
                  {/* Bounding box 1 */}
                  <div className="h-[25%] border-2 border-dashed border-purple-500 bg-purple-950/20 rounded-md relative flex items-center justify-center">
                    <span className="absolute top-1 left-1 px-1 py-0.5 bg-purple-600 rounded text-[8px] font-mono text-white">#1</span>
                  </div>
                  {/* Bounding box 2 */}
                  <div className="h-[30%] border-2 border-dashed border-purple-500 bg-purple-950/20 rounded-md relative flex items-center justify-center">
                    <span className="absolute top-1 left-1 px-1 py-0.5 bg-purple-600 rounded text-[8px] font-mono text-white">#2</span>
                  </div>
                  {/* Bounding box 3 */}
                  <div className="h-[35%] border-2 border-dashed border-purple-500 bg-purple-950/20 rounded-md relative flex items-center justify-center">
                    <span className="absolute top-1 left-1 px-1 py-0.5 bg-purple-600 rounded text-[8px] font-mono text-white">#3</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case "bubblecleaner":
        return (
          <div className="flex-1 flex flex-col lg:flex-row gap-6 p-6 min-h-0 overflow-y-auto">
            {/* Bubble Cleaner Settings Panel */}
            <div className="w-full lg:w-80 flex-shrink-0 bg-neutral-900/60 border border-neutral-800/60 rounded-2xl p-5 space-y-5">
              <div>
                <h3 className="text-sm font-bold font-mono text-white flex items-center gap-2">
                  <Eraser className="h-4 w-4 text-purple-400" />
                  Speech Bubble Cleaner
                </h3>
                <p className="text-[10px] font-mono text-neutral-500 mt-1">
                  Erase and inpaint text inside manga speech bubbles
                </p>
              </div>

              {/* Sliders */}
              <div className="space-y-4">
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-neutral-400">Detection sensitivity</span>
                    <span className="text-purple-400 font-bold">75%</span>
                  </div>
                  <input type="range" min={1} max={100} defaultValue={75} className="w-full h-1.5 accent-purple-500 cursor-pointer" />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-neutral-400">Bubble Dilation (Radius)</span>
                    <span className="text-purple-400 font-bold">4 px</span>
                  </div>
                  <input type="range" min={0} max={20} defaultValue={4} className="w-full h-1.5 accent-purple-500 cursor-pointer" />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-neutral-400">Inpaint Radius</span>
                    <span className="text-purple-400 font-bold">8 px</span>
                  </div>
                  <input type="range" min={1} max={30} defaultValue={8} className="w-full h-1.5 accent-purple-500 cursor-pointer" />
                </div>
              </div>

              {/* Dropdowns */}
              <div className="space-y-3 pt-2 border-t border-neutral-800/40">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-neutral-500 font-mono">
                    Detection Style
                  </label>
                  <select className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs font-mono text-neutral-300 focus:outline-none focus:border-purple-600/40">
                    <option>Deep Learning (AI model)</option>
                    <option>Canny Edges & Contours</option>
                    <option>Manual Mask Selection</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-neutral-500 font-mono">
                    Erase Method
                  </label>
                  <select className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs font-mono text-neutral-300 focus:outline-none focus:border-purple-600/40">
                    <option>Inpaint (FMM Telea)</option>
                    <option>Inpaint (Navier-Stokes)</option>
                    <option>Solid Background Color Fill</option>
                    <option>Transparent Cut</option>
                  </select>
                </div>
              </div>

              <button className="w-full py-3 rounded-xl bg-rose-900/30 hover:bg-rose-900/50 border border-rose-800/40 text-rose-200 font-mono text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5">
                <Eraser className="h-3.5 w-3.5" />
                Clean Speech Bubbles
              </button>
            </div>

            {/* Bubble canvas preview */}
            <div className="flex-1 bg-neutral-900/40 border border-neutral-800/50 rounded-2xl p-5 flex flex-col justify-between">
              <div className="flex items-center justify-between pb-3 border-b border-neutral-800/40 mb-4">
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-white font-mono">
                    Inpaint Canvas
                  </h4>
                  <p className="text-[10px] font-mono text-neutral-500 mt-0.5">
                    Speech bubbles detected for inpainting mask
                  </p>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 bg-rose-950/40 border border-rose-800/60 rounded text-rose-300">
                  2 Bubbles Detected
                </span>
              </div>

              {/* Canvas strip representation */}
              <div className="flex-1 bg-neutral-950 border border-neutral-800 rounded-xl flex items-center justify-center p-8 overflow-hidden relative">
                <div className="w-64 aspect-[9/14] bg-neutral-900 rounded-lg relative overflow-hidden p-4 flex flex-col justify-center gap-4 shadow-2xl">
                  {/* Bubble 1 highlight */}
                  <div className="absolute top-10 right-6 w-20 h-12 rounded-full border-2 border-emerald-500 bg-emerald-500/20 flex items-center justify-center shadow-lg">
                    <span className="text-[8px] font-mono text-emerald-300">Mask #1</span>
                  </div>
                  {/* Bubble 2 highlight */}
                  <div className="absolute bottom-12 left-6 w-24 h-14 rounded-full border-2 border-emerald-500 bg-emerald-500/20 flex items-center justify-center shadow-lg">
                    <span className="text-[8px] font-mono text-emerald-300">Mask #2</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case "editor":
        return (
          <div className="flex-1 flex flex-col lg:flex-row gap-6 p-6 min-h-0 overflow-y-auto">
            {/* Editor Workspace Tools */}
            <div className="w-full lg:w-60 flex-shrink-0 bg-neutral-900/60 border border-neutral-800/60 rounded-2xl p-5 space-y-4">
              <h3 className="text-sm font-bold font-mono text-white">
                Canvas Options
              </h3>

              <div className="space-y-3">
                <button className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-purple-900/20 border border-purple-800/40 text-purple-300 text-xs font-mono hover:bg-purple-900/40 transition-all cursor-pointer">
                  <span className="flex items-center gap-2"><Move className="h-3.5 w-3.5" /> Move Canvas</span>
                  <kbd className="text-[9px] bg-neutral-950 px-1 py-0.5 rounded text-neutral-500 font-mono">M</kbd>
                </button>
                <button className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-neutral-800/40 hover:bg-neutral-850 border border-neutral-800/60 hover:border-neutral-700 text-neutral-400 hover:text-white text-xs font-mono transition-all cursor-pointer">
                  <span className="flex items-center gap-2"><Crop className="h-3.5 w-3.5" /> Crop Selected</span>
                  <kbd className="text-[9px] bg-neutral-950 px-1 py-0.5 rounded text-neutral-500 font-mono">C</kbd>
                </button>
                <button className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-neutral-800/40 hover:bg-neutral-850 border border-neutral-800/60 hover:border-neutral-700 text-neutral-400 hover:text-white text-xs font-mono transition-all cursor-pointer">
                  <span className="flex items-center gap-2"><Type className="h-3.5 w-3.5" /> Add Text</span>
                  <kbd className="text-[9px] bg-neutral-950 px-1 py-0.5 rounded text-neutral-500 font-mono">T</kbd>
                </button>
                <button className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-neutral-800/40 hover:bg-neutral-850 border border-neutral-800/60 hover:border-neutral-700 text-neutral-400 hover:text-white text-xs font-mono transition-all cursor-pointer">
                  <span className="flex items-center gap-2"><Paintbrush className="h-3.5 w-3.5" /> Brush Tool</span>
                  <kbd className="text-[9px] bg-neutral-950 px-1 py-0.5 rounded text-neutral-500 font-mono">B</kbd>
                </button>
              </div>

              {/* Mini Transform Info */}
              <div className="pt-4 border-t border-neutral-800/40 space-y-2">
                <span className="text-[9px] font-black uppercase tracking-wider text-neutral-600 font-mono block">Transform info</span>
                <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                  <div className="p-2 bg-neutral-950/60 rounded border border-neutral-900/60">
                    <span className="text-neutral-500 block text-[8px] uppercase">Width</span>
                    <span className="text-neutral-300 font-bold">1080 px</span>
                  </div>
                  <div className="p-2 bg-neutral-950/60 rounded border border-neutral-900/60">
                    <span className="text-neutral-500 block text-[8px] uppercase">Height</span>
                    <span className="text-neutral-300 font-bold">1920 px</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Advanced Drawing / Editing Canvas */}
            <div className="flex-1 bg-neutral-900/40 border border-neutral-800/50 rounded-2xl p-5 flex flex-col justify-between">
              <div className="flex items-center justify-between pb-3 border-b border-neutral-800/40 mb-4">
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-white font-mono">
                    Editor Viewport
                  </h4>
                  <p className="text-[10px] font-mono text-neutral-500 mt-0.5">
                    Precise panel cropping and composition workspace
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button className="p-1 rounded bg-neutral-800 hover:bg-neutral-750 text-neutral-400 hover:text-white transition-all cursor-pointer"><RotateCcw className="h-3.5 w-3.5" /></button>
                  <button className="p-1 rounded bg-neutral-800 hover:bg-neutral-750 text-neutral-400 hover:text-white transition-all cursor-pointer"><RotateCw className="h-3.5 w-3.5" /></button>
                </div>
              </div>

              {/* Viewport */}
              <div className="flex-1 bg-neutral-950 border border-neutral-800 rounded-xl flex items-center justify-center p-8 overflow-hidden relative">
                {/* Simulated Panel with active resizing bounds */}
                <div className="w-48 aspect-[9/12] bg-neutral-900 rounded-lg relative overflow-hidden border border-purple-500/50 shadow-2xl">
                  {/* Grid overlay */}
                  <div
                    className="absolute inset-0 pointer-events-none opacity-[0.04]"
                    style={{
                      backgroundImage:
                        "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
                      backgroundSize: "20px 20px",
                    }}
                  />
                  {/* Active resize handles */}
                  <div className="absolute -top-1 -left-1 w-3 h-3 bg-purple-500 border border-white cursor-nwse-resize rounded" />
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-purple-500 border border-white cursor-nesw-resize rounded" />
                  <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-purple-500 border border-white cursor-nesw-resize rounded" />
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-purple-500 border border-white cursor-nwse-resize rounded" />

                  {/* Resizing borders */}
                  <div className="absolute inset-0 border-2 border-purple-500 pointer-events-none animate-pulse" />

                  {/* Inside panel graphics */}
                  <div className="absolute inset-4 bg-neutral-800/40 rounded flex items-center justify-center">
                    <span className="text-[10px] font-mono text-neutral-500">Panel Art Composition</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case "metadata":
        return (
          <div className="flex-1 overflow-y-auto p-6 max-w-2xl mx-auto w-full">
            <div className="space-y-6">
              {[
                { label: "Series Title", placeholder: "e.g. Attack on Titan", value: "Sonikoma Chronicles" },
                { label: "Chapter Number", placeholder: "e.g. 42", value: "Chapter 3" },
                { label: "Chapter Title", placeholder: "e.g. The Awakening", value: "The Reckoning" },
                { label: "Author", placeholder: "e.g. Hajime Isayama", value: "Studio Koma" },
              ].map((field) => (
                <div key={field.label} className="space-y-2">
                  <label className="text-[11px] font-black font-mono uppercase tracking-widest text-neutral-500">
                    {field.label}
                  </label>
                  <input
                    type="text"
                    defaultValue={field.value}
                    placeholder={field.placeholder}
                    className="w-full px-4 py-3 bg-neutral-900/60 border border-neutral-800/60 rounded-xl text-sm font-mono text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-purple-600/50 focus:bg-neutral-900 transition-all"
                  />
                </div>
              ))}
              <div className="space-y-2">
                <label className="text-[11px] font-black font-mono uppercase tracking-widest text-neutral-500">
                  Synopsis
                </label>
                <textarea
                  rows={4}
                  defaultValue="In a world where sound is weaponized, the last guardians of silence must rise..."
                  className="w-full px-4 py-3 bg-neutral-900/60 border border-neutral-800/60 rounded-xl text-sm font-mono text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-purple-600/50 resize-none transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-black font-mono uppercase tracking-widest text-neutral-500">
                  Genre Tags
                </label>
                <div className="flex flex-wrap gap-2">
                  {["Action", "Sci-Fi", "Drama", "Thriller", "+ Add"].map((tag, i) => (
                    <span
                      key={tag}
                      className={`px-3 py-1.5 rounded-full text-[11px] font-mono cursor-pointer transition-all ${
                        i < 4
                          ? "bg-purple-900/30 border border-purple-800/40 text-purple-300 hover:bg-purple-900/50"
                          : "bg-neutral-800/60 border border-dashed border-neutral-700 text-neutral-500 hover:text-neutral-300"
                      }`}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case "timeline":
        return (
          <div className="flex-1 overflow-auto p-6">
            <div className="space-y-4">
              {/* Timeline header */}
              <div className="flex items-center gap-4 pb-2 border-b border-neutral-800/50">
                <div className="flex items-center gap-2">
                  <button className="p-2 rounded-xl bg-purple-600/20 border border-purple-700/40 text-purple-300 hover:bg-purple-600/30 cursor-pointer transition-all">
                    <Film className="h-4 w-4" />
                  </button>
                  <div>
                    <p className="text-xs font-bold font-mono text-white">Video Track</p>
                    <p className="text-[10px] font-mono text-neutral-500">6 panels · 18.4s total</p>
                  </div>
                </div>
                <div className="ml-auto flex items-center gap-2">
                  <span className="text-[10px] font-mono text-neutral-500">00:00</span>
                  <div className="w-48 h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                    <div className="h-full w-2/5 bg-gradient-to-r from-purple-600 to-purple-400 rounded-full" />
                  </div>
                  <span className="text-[10px] font-mono text-neutral-500">00:18</span>
                </div>
              </div>

              {/* Track rows */}
              {[
                { label: "Video", icon: Film, color: "purple", items: PANELS_MOCK },
                { label: "Audio", icon: Music, color: "sky", items: PANELS_MOCK.slice(0, 3) },
                { label: "Voice", icon: Mic, color: "rose", items: PANELS_MOCK.slice(1, 4) },
              ].map((track) => (
                <div key={track.label} className="flex items-center gap-3">
                  <div className="w-20 flex-shrink-0 flex items-center gap-2">
                    <track.icon className={`h-3.5 w-3.5 text-${track.color}-400`} />
                    <span className="text-[11px] font-mono text-neutral-400">{track.label}</span>
                  </div>
                  <div className="flex-1 h-10 bg-neutral-900/60 rounded-xl border border-neutral-800/50 relative overflow-hidden flex items-center gap-1 px-1">
                    {track.items.map((item, i) => (
                      <div
                        key={item.id}
                        className={`h-7 rounded-lg bg-${track.color}-900/50 border border-${track.color}-800/50 flex items-center justify-center cursor-pointer hover:border-${track.color}-600/60 transition-all`}
                        style={{ width: `${parseFloat(item.duration) * 8}%` }}
                      >
                        <span className={`text-[9px] font-mono text-${track.color}-400 truncate px-1`}>
                          P{i + 1}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case "settings":
        return (
          <div className="flex-1 overflow-y-auto p-6 max-w-2xl mx-auto w-full">
            <div className="space-y-6">
              {[
                {
                  label: "Output Format",
                  options: ["MP4 H.264", "WebM VP9", "GIF", "APNG"],
                  selected: 0,
                },
                {
                  label: "Aspect Ratio",
                  options: ["9:16 (Vertical)", "16:9 (Landscape)", "1:1 (Square)", "4:3 (Classic)"],
                  selected: 0,
                },
                {
                  label: "Frame Rate",
                  options: ["24 FPS", "30 FPS", "60 FPS"],
                  selected: 1,
                },
                {
                  label: "Quality Preset",
                  options: ["Ultra HD", "High", "Medium", "Draft"],
                  selected: 1,
                },
              ].map((setting) => (
                <div key={setting.label} className="space-y-2">
                  <label className="text-[11px] font-black font-mono uppercase tracking-widest text-neutral-500">
                    {setting.label}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {setting.options.map((opt, i) => (
                      <button
                        key={opt}
                        className={`px-4 py-2 rounded-xl text-[11px] font-mono transition-all cursor-pointer ${
                          i === setting.selected
                            ? "bg-purple-600/30 border border-purple-600/60 text-purple-200"
                            : "bg-neutral-900/60 border border-neutral-800/60 text-neutral-400 hover:border-neutral-700 hover:text-neutral-200"
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              ))}

              {/* Toggles */}
              <div className="space-y-3 pt-2 border-t border-neutral-800/50">
                {[
                  { label: "Auto-save every 5 minutes", checked: true },
                  { label: "Show grid overlay", checked: false },
                  { label: "Snap to guides", checked: true },
                  { label: "Hardware acceleration", checked: true },
                ].map((toggle) => (
                  <label key={toggle.label} className="flex items-center justify-between cursor-pointer group">
                    <span className="text-sm font-mono text-neutral-400 group-hover:text-neutral-200 transition-colors">
                      {toggle.label}
                    </span>
                    <div
                      className={`w-10 h-5 rounded-full flex items-center transition-all ${
                        toggle.checked ? "bg-purple-600" : "bg-neutral-700"
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform mx-0.5 ${
                          toggle.checked ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>
        );
    }
  };

  // ─── RIGHT PROPERTIES PANEL CONTENT ──────────────────────────
  const renderRightPanel = () => (
    <div className="space-y-5">
      {/* Panel info */}
      {selectedPanel ? (
        <>
          <div className="space-y-3">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-neutral-500 font-mono">
              Selected Panel
            </h4>
            <div className="p-3 bg-neutral-900/60 rounded-xl border border-neutral-800/50 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono text-neutral-400">ID</span>
                <span className="text-[11px] font-mono text-purple-300">{selectedPanel.id}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono text-neutral-400">Duration</span>
                <span className="text-[11px] font-mono text-white">{selectedPanel.duration}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono text-neutral-400">Status</span>
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                    selectedPanel.status === "ready"
                      ? "text-emerald-400 bg-emerald-950/50 border-emerald-800/50"
                      : "text-amber-400 bg-amber-950/50 border-amber-800/50"
                  }`}
                >
                  {selectedPanel.status}
                </span>
              </div>
            </div>
          </div>

          {/* Quick actions */}
          <div className="space-y-2">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-neutral-500 font-mono">
              Quick Actions
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "Crop", icon: Crop },
                { label: "Clean Bubbles", icon: Eraser },
                { label: "Add Voice", icon: Mic },
                { label: "Add Music", icon: Music },
              ].map((action) => (
                <button
                  key={action.label}
                  className="flex flex-col items-center gap-1.5 p-2.5 rounded-xl bg-neutral-800/40 hover:bg-neutral-800 border border-neutral-800/60 hover:border-neutral-700 text-neutral-500 hover:text-white transition-all cursor-pointer"
                >
                  <action.icon className="h-4 w-4" />
                  <span className="text-[9px] font-mono">{action.label}</span>
                </button>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-10 text-neutral-600 gap-3">
          <MousePointer2 className="h-8 w-8" />
          <div className="text-center">
            <p className="text-[11px] font-mono">No panel selected</p>
            <p className="text-[10px] font-mono text-neutral-700 mt-1">Click a panel to inspect it</p>
          </div>
        </div>
      )}

      {/* Transform controls */}
      <div className="space-y-3">
        <h4 className="text-[10px] font-black uppercase tracking-widest text-neutral-500 font-mono">
          Transform
        </h4>
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: "X", value: "0" },
            { label: "Y", value: "0" },
            { label: "W", value: "1080" },
            { label: "H", value: "1920" },
          ].map((field) => (
            <div key={field.label} className="space-y-1">
              <label className="text-[9px] font-mono uppercase text-neutral-600">{field.label}</label>
              <input
                type="number"
                defaultValue={field.value}
                className="w-full px-2 py-1.5 bg-neutral-800/60 border border-neutral-700/50 rounded-lg text-[11px] font-mono text-neutral-200 focus:outline-none focus:border-purple-600/50 text-right"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Appearance */}
      <div className="space-y-3">
        <h4 className="text-[10px] font-black uppercase tracking-widest text-neutral-500 font-mono">
          Appearance
        </h4>
        <div className="space-y-3">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-mono text-neutral-400">Brightness</label>
              <span className="text-[11px] font-mono text-neutral-300">100%</span>
            </div>
            <input type="range" min={0} max={200} defaultValue={100} className="w-full h-1.5 accent-purple-500 cursor-pointer" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-mono text-neutral-400">Contrast</label>
              <span className="text-[11px] font-mono text-neutral-300">100%</span>
            </div>
            <input type="range" min={0} max={200} defaultValue={100} className="w-full h-1.5 accent-purple-500 cursor-pointer" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-mono text-neutral-400">Saturation</label>
              <span className="text-[11px] font-mono text-neutral-300">100%</span>
            </div>
            <input type="range" min={0} max={200} defaultValue={100} className="w-full h-1.5 accent-purple-500 cursor-pointer" />
          </div>
        </div>
      </div>
    </div>
  );

  // ─── RENDER ───────────────────────────────────────────────────
  return (
    <div className="flex h-screen bg-[#070709] text-neutral-100 overflow-hidden">
      {/* Main canvas area — all bars removed */}
      <div className="flex-1 flex flex-col overflow-hidden bg-[#070709] relative">
        <div className="flex-1 overflow-auto relative">
          {/* Subtle grid background */}
          <div
            className="absolute inset-0 pointer-events-none opacity-[0.04]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
              backgroundSize: "40px 40px",
            }}
          />
          <div className="relative min-h-full flex flex-col">{renderMainContent()}</div>
        </div>
      </div>
    </div>
  );
}

