import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { StringFieldUpdateOperationsInputSchema } from './StringFieldUpdateOperationsInputSchema';
import { IntFieldUpdateOperationsInputSchema } from './IntFieldUpdateOperationsInputSchema';
import { UserUpdateOneRequiredWithoutLeaguePointsNestedInputSchema } from './UserUpdateOneRequiredWithoutLeaguePointsNestedInputSchema';

export const LeaguePointsUpdateWithoutLeagueInputSchema: z.ZodType<Prisma.LeaguePointsUpdateWithoutLeagueInput> = z.object({
  id: z.union([ z.string().cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  totalPoints: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  user: z.lazy(() => UserUpdateOneRequiredWithoutLeaguePointsNestedInputSchema).optional()
}).strict();

export default LeaguePointsUpdateWithoutLeagueInputSchema;
