import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { LeaguePointsUncheckedCreateNestedManyWithoutLeagueInputSchema } from './LeaguePointsUncheckedCreateNestedManyWithoutLeagueInputSchema';

export const LeagueUncheckedCreateWithoutCompetitionsInputSchema: z.ZodType<Prisma.LeagueUncheckedCreateWithoutCompetitionsInput> = z.object({
  id: z.string().cuid().optional(),
  name: z.string(),
  description: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  leaguePoints: z.lazy(() => LeaguePointsUncheckedCreateNestedManyWithoutLeagueInputSchema).optional()
}).strict();

export default LeagueUncheckedCreateWithoutCompetitionsInputSchema;
