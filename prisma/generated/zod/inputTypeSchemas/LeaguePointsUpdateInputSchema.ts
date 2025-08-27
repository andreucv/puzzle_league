import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { StringFieldUpdateOperationsInputSchema } from './StringFieldUpdateOperationsInputSchema';
import { IntFieldUpdateOperationsInputSchema } from './IntFieldUpdateOperationsInputSchema';
import { LeagueUpdateOneRequiredWithoutLeaguePointsNestedInputSchema } from './LeagueUpdateOneRequiredWithoutLeaguePointsNestedInputSchema';
import { UserUpdateOneRequiredWithoutLeaguePointsNestedInputSchema } from './UserUpdateOneRequiredWithoutLeaguePointsNestedInputSchema';

export const LeaguePointsUpdateInputSchema: z.ZodType<Prisma.LeaguePointsUpdateInput> = z.object({
  id: z.union([ z.string().cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  totalPoints: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  league: z.lazy(() => LeagueUpdateOneRequiredWithoutLeaguePointsNestedInputSchema).optional(),
  user: z.lazy(() => UserUpdateOneRequiredWithoutLeaguePointsNestedInputSchema).optional()
}).strict();

export default LeaguePointsUpdateInputSchema;
