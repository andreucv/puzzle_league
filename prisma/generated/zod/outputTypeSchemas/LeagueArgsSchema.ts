import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { LeagueSelectSchema } from '../inputTypeSchemas/LeagueSelectSchema';
import { LeagueIncludeSchema } from '../inputTypeSchemas/LeagueIncludeSchema';

export const LeagueArgsSchema: z.ZodType<Prisma.LeagueDefaultArgs> = z.object({
  select: z.lazy(() => LeagueSelectSchema).optional(),
  include: z.lazy(() => LeagueIncludeSchema).optional(),
}).strict();

export default LeagueArgsSchema;
