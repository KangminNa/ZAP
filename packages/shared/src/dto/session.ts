import { z } from 'zod';
import { FileMetaSchema } from './file';
import { TTL_LABELS } from '../primitives/TTL';

export const SessionStatusSchema = z.enum(['uploading', 'ready', 'expired']);
export type SessionStatusDto = z.infer<typeof SessionStatusSchema>;

export const TTLLabelSchema = z.enum(TTL_LABELS);

export const CreateSessionRequestSchema = z.object({
  fileCount: z.number().int().positive(),
  ttl: TTLLabelSchema,
  files: z.array(FileMetaSchema).min(1).max(2000),
  targetDeviceId: z.string().min(1),
});
export type CreateSessionRequest = z.infer<typeof CreateSessionRequestSchema>;

export const CreateSessionResponseSchema = z.object({
  sessionId: z.string(),
  presignedUrls: z.array(z.string().url()),
  expiresAt: z.string(),
  transferToken: z.string(),
});
export type CreateSessionResponse = z.infer<typeof CreateSessionResponseSchema>;

export const GetSessionResponseSchema = z.object({
  sessionId: z.string(),
  status: SessionStatusSchema,
  fileCount: z.number().int().nonnegative(),
  uploadedCount: z.number().int().nonnegative(),
  expiresAt: z.string(),
});
export type GetSessionResponse = z.infer<typeof GetSessionResponseSchema>;
