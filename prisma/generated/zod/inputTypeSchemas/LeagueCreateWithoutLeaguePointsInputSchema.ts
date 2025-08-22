import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { CompetitionCreateNestedManyWithoutLeagueInputSchema } from './CompetitionCreateNestedManyWithoutLeagueInputSchema';

export const LeagueCreateWithoutLeaguePointsInputSchema: z.ZodType<Prisma.LeagueCreateWithoutLeaguePointsInput> = z.object({
  id: z.string().cuid().optional(),
  name: z.string(),
  description: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  competitions: z.lazy(() => CompetitionCreateNestedManyWithoutLeagueInputSchema).optional()
}).strict();

export default LeagueCreateWithoutLeaguePointsInputSchema;
