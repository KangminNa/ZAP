import { z } from 'zod';

export const FileMetaSchema = z.object({
  name: z.string().min(1).max(512),
  size: z.number().int().nonnegative(),
  mimeType: z.string().min(1).max(128),
});
export type FileMetaDto = z.infer<typeof FileMetaSchema>;
