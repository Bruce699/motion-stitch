import { z } from "zod";
import { DepthOfFieldSchema } from "./camera";

export const ViewerExitPatchSchema = z
  .object({
    sceneId: z
      .string()
      .min(1)
      .max(256)
      .regex(/^[a-z0-9-]+$/),
    patch: z
      .object({
        depthOfField: z
          .object({
            focusPlane: DepthOfFieldSchema.shape.focusPlane
              .removeDefault()
              .optional(),
            blur: DepthOfFieldSchema.shape.blur.removeDefault().optional(),
          })
          .strict()
          .refine(
            (value) => Object.keys(value).length > 0,
            "Final lens patch is empty",
          ),
      })
      .strict(),
  })
  .strict();
export const ViewerExitSchema = z
  .object({
    type: z.literal("viewer_exit"),
    viewId: z.string().uuid(),
    patches: z.array(ViewerExitPatchSchema).max(16),
  })
  .strict();
export type ViewerExitPatch = z.infer<typeof ViewerExitPatchSchema>;
