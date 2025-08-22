import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { CompetitionCountOutputTypeSelectSchema } from './CompetitionCountOutputTypeSelectSchema';

export const CompetitionCountOutputTypeArgsSchema: z.ZodType<Prisma.CompetitionCountOutputTypeDefaultArgs> = z.object({
  select: z.lazy(() => CompetitionCountOutputTypeSelectSchema).nullish(),
}).strict();

export default CompetitionCountOutputTypeSelectSchema;
