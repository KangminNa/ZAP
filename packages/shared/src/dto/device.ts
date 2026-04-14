import { z } from 'zod';

export const DeviceTypeSchema = z.enum([
  'mac',
  'ios',
  'android',
  'windows',
  'linux',
  'unknown',
]);
export type DeviceTypeDto = z.infer<typeof DeviceTypeSchema>;

export const DeviceSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(64),
  type: DeviceTypeSchema,
});
export type DeviceDto = z.infer<typeof DeviceSchema>;
