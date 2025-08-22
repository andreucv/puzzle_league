import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { StringFieldUpdateOperationsInputSchema } from './StringFieldUpdateOperationsInputSchema';
import { IntFieldUpdateOperationsInputSchema } from './IntFieldUpdateOperationsInputSchema';
import { LeagueUpdateOneRequiredWithoutLeaguePointsNestedInputSchema } from './LeagueUpdateOneRequiredWithoutLeaguePointsNestedInputSchema';

export const LeaguePointsUpdateWithoutUserInputSchema: z.ZodType<Prisma.LeaguePointsUpdateWithoutUserInput> = z.object({
  id: z.union([ z.string().cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  totalPoints: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  league: z.lazy(() => LeagueUpdateOneRequiredWithoutLeaguePointsNestedInputSchema).optional()
}).strict();

export default LeaguePointsUpdateWithoutUserInputSchema;
