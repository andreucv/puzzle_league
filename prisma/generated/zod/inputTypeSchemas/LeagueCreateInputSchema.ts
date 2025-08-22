import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { CompetitionCreateNestedManyWithoutLeagueInputSchema } from './CompetitionCreateNestedManyWithoutLeagueInputSchema';
import { LeaguePointsCreateNestedManyWithoutLeagueInputSchema } from './LeaguePointsCreateNestedManyWithoutLeagueInputSchema';

export const LeagueCreateInputSchema: z.ZodType<Prisma.LeagueCreateInput> = z.object({
  id: z.string().cuid().optional(),
  name: z.string(),
  description: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  competitions: z.lazy(() => CompetitionCreateNestedManyWithoutLeagueInputSchema).optional(),
  leaguePoints: z.lazy(() => LeaguePointsCreateNestedManyWithoutLeagueInputSchema).optional()
}).strict();

export default LeagueCreateInputSchema;
