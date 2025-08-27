import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { RecordCountOutputTypeSelectSchema } from './RecordCountOutputTypeSelectSchema';

export const RecordCountOutputTypeArgsSchema: z.ZodType<Prisma.RecordCountOutputTypeDefaultArgs> = z.object({
  select: z.lazy(() => RecordCountOutputTypeSelectSchema).nullish(),
}).strict();

export default RecordCountOutputTypeSelectSchema;
