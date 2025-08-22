import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { CompetitionSelectSchema } from '../inputTypeSchemas/CompetitionSelectSchema';
import { CompetitionIncludeSchema } from '../inputTypeSchemas/CompetitionIncludeSchema';

export const CompetitionArgsSchema: z.ZodType<Prisma.CompetitionDefaultArgs> = z.object({
  select: z.lazy(() => CompetitionSelectSchema).optional(),
  include: z.lazy(() => CompetitionIncludeSchema).optional(),
}).strict();

export default CompetitionArgsSchema;
