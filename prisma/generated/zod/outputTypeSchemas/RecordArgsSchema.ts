import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { RecordSelectSchema } from '../inputTypeSchemas/RecordSelectSchema';
import { RecordIncludeSchema } from '../inputTypeSchemas/RecordIncludeSchema';

export const RecordArgsSchema: z.ZodType<Prisma.RecordDefaultArgs> = z.object({
  select: z.lazy(() => RecordSelectSchema).optional(),
  include: z.lazy(() => RecordIncludeSchema).optional(),
}).strict();

export default RecordArgsSchema;
