import { z } from 'zod';
import type { Prisma } from '@prisma/client';

export const RecordCountOutputTypeSelectSchema: z.ZodType<Prisma.RecordCountOutputTypeSelect> = z.object({
  users: z.boolean().optional(),
}).strict();

export default RecordCountOutputTypeSelectSchema;
