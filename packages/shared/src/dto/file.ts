import { z } from 'zod';

export const MAX_FILE_SIZE = 5 * 1024 * 1024 * 1024; // 5 GB
export const MAX_TOTAL_SIZE = 10 * 1024 * 1024 * 1024; // 10 GB

export const FileMetaSchema = z.object({
  name: z.string().min(1).max(512),
  size: z.number().int().min(1).max(MAX_FILE_SIZE),
  mimeType: z.string().min(1).max(128),
});
export type FileMetaDto = z.infer<typeof FileMetaSchema>;
