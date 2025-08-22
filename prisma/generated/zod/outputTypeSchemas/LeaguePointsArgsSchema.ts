import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { LeaguePointsSelectSchema } from '../inputTypeSchemas/LeaguePointsSelectSchema';
import { LeaguePointsIncludeSchema } from '../inputTypeSchemas/LeaguePointsIncludeSchema';

export const LeaguePointsArgsSchema: z.ZodType<Prisma.LeaguePointsDefaultArgs> = z.object({
  select: z.lazy(() => LeaguePointsSelectSchema).optional(),
  include: z.lazy(() => LeaguePointsIncludeSchema).optional(),
}).strict();

export default LeaguePointsArgsSchema;
