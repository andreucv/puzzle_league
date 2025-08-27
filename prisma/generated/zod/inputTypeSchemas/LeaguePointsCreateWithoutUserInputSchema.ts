import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { LeagueCreateNestedOneWithoutLeaguePointsInputSchema } from './LeagueCreateNestedOneWithoutLeaguePointsInputSchema';

export const LeaguePointsCreateWithoutUserInputSchema: z.ZodType<Prisma.LeaguePointsCreateWithoutUserInput> = z.object({
  id: z.string().cuid().optional(),
  totalPoints: z.number().int().optional(),
  league: z.lazy(() => LeagueCreateNestedOneWithoutLeaguePointsInputSchema)
}).strict();

export default LeaguePointsCreateWithoutUserInputSchema;
