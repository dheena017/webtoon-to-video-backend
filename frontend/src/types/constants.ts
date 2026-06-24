export enum PreviewTabMode {
  VIDEO = "video",
  TIMELINE = "timeline",
}

export enum BubbleDetectionStyle {
  ALL = "all",
  WHITE_ONLY = "white_only",
  TEXT_ONLY = "text_only",
}

export enum BubbleEraseMethod {
  AUTO = "auto",
  INPAINT = "inpaint",
  BLUR = "blur",
  SOLID_WHITE = "solid_white",
  SOLID_BLACK = "solid_black",
}

export enum CropBackgroundMode {
  AUTO = "auto",
  WHITE = "white",
  BLACK = "black",
  TRANSPARENT = "transparent",
}

export enum ProcessingStrategy {
  BALANCED = "balanced",
  AGGRESSIVE = "aggressive",
  CONSERVATIVE = "conservative",
}

export enum AspectRatioLock {
  FREE = "free",
  PORTRAIT = "portrait",
  LANDSCAPE = "landscape",
  SQUARE = "square",
}

export enum NarrationStyle {
  LONG = "long",
  SHORT = "short",
}

export enum CropFocusMode {
  STANDARD = "standard",
  FACES = "faces",
  TEXT = "text",
}

export enum AspectRatio {
  PORTRAIT = "9:16",
  LANDSCAPE = "16:9",
}
