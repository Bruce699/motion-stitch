import { z } from "zod";

const color = z.string().regex(/^#[0-9a-fA-F]{6}$/);
const weight = z.enum(["400", "500", "600", "700"]);

const workspaceUIValues = z
  .object({
    switchFontSize: z.number().min(10).max(24).default(13),
    switchPaddingX: z.number().min(6).max(40).default(24),
    switchPaddingY: z.number().min(4).max(20).default(10),
    toolbarScale: z.number().min(0.75).max(1.5).default(0.8),
    toolbarLineHeight: z.number().min(1).max(2).default(1.4),
    labelFontSize: z.number().min(10).max(22).default(12),
    labelLineHeight: z.number().min(1).max(2).default(1.4),
    versionGap: z.number().min(0).max(40).default(12),
    versionOpacity: z.number().min(0).max(1).default(0.6),
    cardPadding: z.number().min(4).max(40).default(12),
    columnGap: z.number().min(0).max(80).default(8),
    rowGap: z.number().min(0).max(80).default(8),
    libraryPadding: z.number().min(8).max(64).default(24),
    previewColumnGap: z.number().min(0).max(120).default(20),
    previewRowGap: z.number().min(0).max(120).default(16),
    previewPaddingTop: z.number().min(0).max(120).default(12),
    previewPaddingBottom: z.number().min(0).max(120).default(12),
    previewPaddingX: z.number().min(0).max(120).default(12),
    previewTransportHeight: z.number().min(32).max(120).default(56),
    previewTransportGap: z.number().min(0).max(32).default(12),
    previewTransportPaddingX: z.number().min(0).max(120).default(20),
    previewTransportMaxWidth: z.number().min(320).max(1600).default(880),
    hoverPreviewWidth: z.number().min(80).max(480).default(80),
    hoverPreviewHeight: z.number().min(45).max(320).default(45),
    hoverPreviewGap: z.number().min(0).max(32).default(8),
    hoverPreviewOffset: z.number().min(0).max(80).default(12),
    hoverPreviewRadius: z.number().min(0).max(32).default(4),
    hoverPreviewPadding: z.number().min(0).max(24).default(4),
    hoverPreviewOuterRadius: z.number().min(0).max(40).default(10),
    hoverPreviewFPS: z.number().int().min(4).max(24).default(10),
    hoverPreviewDelay: z.number().min(0).max(800).default(0),
    clipFontSize: z.number().min(10).max(20).default(11),
    clipHeight: z.number().min(28).max(64).default(32),
    clipPadding: z.number().min(6).max(28).default(8),
    clipWidthMode: z.enum(["duration", "uniform"]).default("duration"),
    clipWidthBase: z.number().min(0).max(1000).default(100),
    clipWidthPerSecond: z.number().min(0).max(100).default(12),
    clipMinWidth: z.number().min(80).max(1000).default(180),
    clipMaxWidth: z.number().min(80).max(1600).default(340),
    clipUniformWidth: z.number().min(80).max(1600).default(240),
    clipColorMode: z.enum(["palette", "uniform"]).default("palette"),
    clipFillColor: color.default("#00bca6"),
    clipTextColor: color.default("#ffffff"),
    clipRadius: z.number().min(0).max(28).default(8),
    clipBorderWidth: z.number().min(0).max(8).default(0),
    clipBorderColor: color.default("#ffffff"),
    clipBorderOpacity: z.number().min(0).max(1).default(1),
    clipTitleWeight: weight.default("500"),
    clipTitleLineHeight: z.number().min(1).max(2.5).default(1),
    clipTitleLetterSpacing: z.number().min(-1).max(3).default(0),
    clipLayoutAlign: z.enum(["left", "center", "right"]).default("left"),
    clipVerticalAlign: z.enum(["start", "center", "end"]).default("center"),
    clipPaddingY: z.number().min(0).max(24).default(0),
    clipItemGap: z.number().min(0).max(40).default(8),
    clipTagGap: z.number().min(0).max(40).default(12),
    clipDurationFontSize: z.number().min(7).max(24).default(10),
    clipDurationOpacity: z.number().min(0).max(1).default(1),
    clipDurationWeight: weight.default("500"),
    clipTagVisible: z.boolean().default(false),
    clipTagFontSize: z.number().min(6).max(24).default(9),
    clipTagWeight: weight.default("500"),
    clipTagPaddingX: z.number().min(0).max(24).default(4),
    clipTagPaddingY: z.number().min(0).max(16).default(3),
    clipTagRadius: z.number().min(0).max(20).default(3),
    clipTagFill: color.default("#ffffff"),
    clipTagFillOpacity: z.number().min(0).max(1).default(0.5),
    clipTagColorMode: z.enum(["clip", "custom"]).default("clip"),
    clipTagTextColor: color.default("#ffffff"),
    clipTagTextOpacity: z.number().min(0).max(1).default(1),
    clipTagBorderWidth: z.number().min(0).max(4).default(0),
    clipTagBorderColor: color.default("#ffffff"),
    clipTagBorderOpacity: z.number().min(0).max(1).default(1),
    clipTagLetterSpacing: z.number().min(-1).max(3).default(0),
    clipGap: z.number().min(0).max(40).default(0),
    snapDistance: z.number().min(4).max(100).default(26),
    snapSettleDuration: z.number().min(0).max(1000).default(160),
    snapCornerDuration: z.number().min(0).max(1000).default(180),
    snapEase: z.enum(["linear", "easeOut", "soft"]).default("soft"),
    snapCornerAnticipation: z.number().min(0).max(1).default(1),
    snapCueVisible: z.boolean().default(true),
    snapCueWidth: z.number().min(0.5).max(32).default(3),
    snapCueHeight: z.number().min(0.5).max(3).default(1.2),
    snapCueRadius: z.number().min(0).max(12).default(12),
    snapCueOpacity: z.number().min(0).max(1).default(1),
    snapCueFadeIn: z.number().min(0).max(1000).default(100),
    snapCueFadeOut: z.number().min(0).max(1000).default(100),
    snapCueGrowDuration: z.number().min(0).max(1000).default(160),
    snapCueStartScale: z.number().min(0).max(1).default(0.25),
    snapCueStartLength: z.number().min(0).max(256).default(12.2),
    snapCueEndLength: z.number().min(0).max(256).default(45.2),
    snapCueGrowthCurve: z
      .enum(["linear", "easeIn", "easeOut", "smooth"])
      .default("linear"),
    snapCueColorMode: z.enum(["clips", "custom"]).default("clips"),
    snapCueGradientAngle: z.number().min(0).max(360).default(143),
    snapCueFromColor: color.default("#00bca6"),
    snapCueToColor: color.default("#ff9900"),
    playPinVisible: z.boolean().default(true),
    playPinWidth: z.number().min(0.5).max(8).default(1.5),
    playPinHeadSize: z.number().min(3).max(12).default(6),
    playPinColor: color.default("#ffffff"),
  })
  .superRefine((ui, context) => {
    if (ui.clipMinWidth > ui.clipMaxWidth)
      context.addIssue({
        code: "custom",
        path: ["clipMinWidth"],
        message: "Minimum clip width cannot exceed maximum clip width",
      });
    if (ui.snapCueStartLength > ui.snapCueEndLength)
      context.addIssue({
        code: "custom",
        path: ["snapCueStartLength"],
        message: "Snap line starting length cannot exceed ending length",
      });
  });

/** Retain older linked typography and snap line lengths as controls become independent. */
export const WorkspaceUISchema = z.preprocess((input) => {
  if (!input || typeof input !== "object" || Array.isArray(input)) return input;
  const values = { ...(input as Record<string, unknown>) };
  if (typeof values.clipFontSize === "number") {
    if (values.clipTagFontSize === undefined)
      values.clipTagFontSize = Math.max(9, values.clipFontSize - 2);
    if (values.clipDurationFontSize === undefined)
      values.clipDurationFontSize = Math.max(10, values.clipFontSize - 1);
  }
  if (values.clipTagGap === undefined && typeof values.versionGap === "number")
    values.clipTagGap = values.versionGap;
  const hasLegacyLength = [
    values.clipHeight,
    values.snapCueHeight,
    values.snapCueStartScale,
  ].some((value) => typeof value === "number");
  if (hasLegacyLength) {
    const legacyLength =
      (typeof values.clipHeight === "number" ? values.clipHeight : 32) *
      (typeof values.snapCueHeight === "number" ? values.snapCueHeight : 1.2);
    if (values.snapCueEndLength === undefined)
      values.snapCueEndLength = legacyLength;
    if (values.snapCueStartLength === undefined)
      values.snapCueStartLength =
        legacyLength *
        (typeof values.snapCueStartScale === "number"
          ? values.snapCueStartScale
          : 0.25);
  }
  return values;
}, workspaceUIValues);
export type WorkspaceUI = z.infer<typeof WorkspaceUISchema>;

/** Reset canvas styling and behavior without changing View or Library settings. */
export function resetWorkspaceBoxUI(ui?: unknown): WorkspaceUI {
  const current = WorkspaceUISchema.parse(ui ?? {});
  const defaults = WorkspaceUISchema.parse({});
  return WorkspaceUISchema.parse({
    ...current,
    ...Object.fromEntries(
      Object.entries(defaults).filter(([key]) =>
        /^(clip|snap|playPin)/.test(key),
      ),
    ),
  });
}

/** Reset the snap interaction without changing box appearance or playback controls. */
export function resetWorkspaceSnapUI(ui?: unknown): WorkspaceUI {
  const current = WorkspaceUISchema.parse(ui ?? {});
  const defaults = WorkspaceUISchema.parse({});
  return WorkspaceUISchema.parse({
    ...current,
    ...Object.fromEntries(
      Object.entries(defaults).filter(
        ([key]) => key === "clipGap" || key.startsWith("snap"),
      ),
    ),
  });
}

/** Reset preview spacing while preserving all other workspace styling and motion. */
export function resetWorkspacePreviewUI(ui?: unknown): WorkspaceUI {
  const current = WorkspaceUISchema.parse(ui ?? {});
  const defaults = WorkspaceUISchema.parse({});
  return {
    ...current,
    previewColumnGap: defaults.previewColumnGap,
    previewRowGap: defaults.previewRowGap,
  };
}

/** Reset stage spacing without changing the view pill, preview grid, or canvas. */
export function resetWorkspaceStageUI(ui?: unknown): WorkspaceUI {
  const current = WorkspaceUISchema.parse(ui ?? {});
  const defaults = WorkspaceUISchema.parse({});
  return {
    ...current,
    previewPaddingTop: defaults.previewPaddingTop,
    previewPaddingBottom: defaults.previewPaddingBottom,
    previewPaddingX: defaults.previewPaddingX,
    previewTransportHeight: defaults.previewTransportHeight,
    previewTransportGap: defaults.previewTransportGap,
    previewTransportPaddingX: defaults.previewTransportPaddingX,
    previewTransportMaxWidth: defaults.previewTransportMaxWidth,
  };
}

/** Reset floating clip previews without changing the canvas, stage, or Library. */
export function resetWorkspaceHoverUI(ui?: unknown): WorkspaceUI {
  const current = WorkspaceUISchema.parse(ui ?? {});
  const defaults = WorkspaceUISchema.parse({});
  return {
    ...current,
    hoverPreviewWidth: defaults.hoverPreviewWidth,
    hoverPreviewHeight: defaults.hoverPreviewHeight,
    hoverPreviewGap: defaults.hoverPreviewGap,
    hoverPreviewOffset: defaults.hoverPreviewOffset,
    hoverPreviewRadius: defaults.hoverPreviewRadius,
    hoverPreviewPadding: defaults.hoverPreviewPadding,
    hoverPreviewOuterRadius: defaults.hoverPreviewOuterRadius,
    hoverPreviewFPS: defaults.hoverPreviewFPS,
    hoverPreviewDelay: defaults.hoverPreviewDelay,
  };
}

export const CompositionDetailsSchema = z.object({
  title: z.string().trim().min(1).max(160).optional(),
  version: z.number().int().min(1).max(9999).default(1),
  clipWidth: z.number().min(80).max(1600).optional(),
  clipColor: color.optional(),
});
export type CompositionDetails = z.infer<typeof CompositionDetailsSchema>;

export function compositionDetails(
  scene: { id: string; name: string },
  details?: Record<string, CompositionDetails>,
) {
  const title = details?.[scene.id]?.title ?? scene.name;
  const normalizedTitle = title.trim();
  const separator = /\s+[-/]\s+|[–—]/.exec(normalizedTitle);
  const sceneName = separator
    ? normalizedTitle.slice(0, separator.index).trim()
    : normalizedTitle;
  const versionName = separator
    ? normalizedTitle.slice(separator.index + separator[0].length).trim()
    : "";
  const hasVersion = Boolean(sceneName && versionName);
  return {
    ...details?.[scene.id],
    title,
    sceneName: hasVersion ? sceneName : normalizedTitle,
    versionName: hasVersion ? versionName : "",
  };
}

export function matchesComposition(
  details: { title: string; sceneName: string; versionName: string },
  sceneName: string,
  versionName: string,
  query: string,
  keywords = "",
) {
  return (
    (sceneName === "all" || details.sceneName === sceneName) &&
    (versionName === "all" || details.versionName === versionName) &&
    `${details.title} ${details.sceneName} ${details.versionName} ${keywords}`
      .toLowerCase()
      .includes(query.trim().toLowerCase())
  );
}
