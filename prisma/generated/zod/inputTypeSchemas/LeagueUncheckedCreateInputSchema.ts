import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { CompetitionUncheckedCreateNestedManyWithoutLeagueInputSchema } from './CompetitionUncheckedCreateNestedManyWithoutLeagueInputSchema';
import { LeaguePointsUncheckedCreateNestedManyWithoutLeagueInputSchema } from './LeaguePointsUncheckedCreateNestedManyWithoutLeagueInputSchema';

export const LeagueUncheckedCreateInputSchema: z.ZodType<Prisma.LeagueUncheckedCreateInput> = z.object({
  id: z.string().cuid().optional(),
  name: z.string(),
  description: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  competitions: z.lazy(() => CompetitionUncheckedCreateNestedManyWithoutLeagueInputSchema).optional(),
  leaguePoints: z.lazy(() => LeaguePointsUncheckedCreateNestedManyWithoutLeagueInputSchema).optional()
}).strict();

export default LeagueUncheckedCreateInputSchema;
