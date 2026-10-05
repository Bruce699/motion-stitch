import { z } from "zod";

/** Compact posters and workspace playback use separate raster sessions;
 * authored settings remain unchanged in returned documents and editor/export.
 */
export const PreviewProfileSchema = z
  .enum(["thumbnail", "playback"])
  .optional();
export type PreviewProfile = z.infer<typeof PreviewProfileSchema>;
