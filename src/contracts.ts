import { z } from "./validation";
import { parseVideo } from "./video";

export const MAX_MOMENTS = 1000;
export const secondsSchema = z.number().int().min(0).max(604800);
export const videoSchema = z
  .object({
    id: z.string(),
    url: z.string(),
    isShort: z.boolean(),
  })
  .refine((value) => parseVideo(value.url)?.id === value.id);
export const selectionSchema = z.object({
  video: videoSchema,
  title: z.string().max(500),
  seconds: secondsSchema,
  duration: secondsSchema.positive().nullable(),
});
export type Selection = z.infer<typeof selectionSchema>;
export const draftSchema = z
  .object({
    video: videoSchema,
    title: z.string().max(500),
    start: secondsSchema,
    end: secondsSchema.nullable(),
    note: z.string().trim().max(2000),
  })
  .refine((value) => value.end === null || value.end > value.start, {
    message: "End time must be after start time.",
  });
export type MomentDraft = z.infer<typeof draftSchema>;
export const momentSchema = draftSchema.safeExtend({
  id: z.string().uuid(),
  createdAt: z.number().int().nonnegative(),
});
export type Moment = z.infer<typeof momentSchema>;
export const snapshotSchema = z.object({
  moments: z.array(momentSchema).max(MAX_MOMENTS),
});
export type Snapshot = z.infer<typeof snapshotSchema>;
export const initialState: Snapshot = { moments: [] };
export const popupMessageSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("snapshot") }),
  z.object({ type: z.literal("save-moment"), draft: draftSchema }),
  z.object({ type: z.literal("remove-moment"), id: z.string().uuid() }),
  z.object({ type: z.literal("restore-moment"), moment: momentSchema }),
]);
export type PopupMessage = z.infer<typeof popupMessageSchema>;
export const replySchema = z.discriminatedUnion("ok", [
  z.object({ ok: z.literal(true), state: snapshotSchema }),
  z.object({ ok: z.literal(false), error: z.string() }),
]);
export function isPopupSender({
  senderUrl,
  extensionOrigin,
}: {
  senderUrl: string | undefined;
  extensionOrigin: string;
}) {
  return senderUrl === `${extensionOrigin}popup.html`;
}
