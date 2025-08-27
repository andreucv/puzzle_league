import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { CompetitionUncheckedCreateNestedManyWithoutLeagueInputSchema } from './CompetitionUncheckedCreateNestedManyWithoutLeagueInputSchema';

export const LeagueUncheckedCreateWithoutLeaguePointsInputSchema: z.ZodType<Prisma.LeagueUncheckedCreateWithoutLeaguePointsInput> = z.object({
  id: z.string().cuid().optional(),
  name: z.string(),
  description: z.string().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  competitions: z.lazy(() => CompetitionUncheckedCreateNestedManyWithoutLeagueInputSchema).optional()
}).strict();

export default LeagueUncheckedCreateWithoutLeaguePointsInputSchema;
