import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { LeaguePointsCreateNestedManyWithoutLeagueInputSchema } from './LeaguePointsCreateNestedManyWithoutLeagueInputSchema';

export const LeagueCreateWithoutCompetitionsInputSchema: z.ZodType<Prisma.LeagueCreateWithoutCompetitionsInput> = z.object({
  id: z.string().cuid().optional(),
  name: z.string(),
  description: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  leaguePoints: z.lazy(() => LeaguePointsCreateNestedManyWithoutLeagueInputSchema).optional()
}).strict();

export default LeagueCreateWithoutCompetitionsInputSchema;
