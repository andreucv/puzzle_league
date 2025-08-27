import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { StringFieldUpdateOperationsInputSchema } from './StringFieldUpdateOperationsInputSchema';
import { NullableStringFieldUpdateOperationsInputSchema } from './NullableStringFieldUpdateOperationsInputSchema';
import { DateTimeFieldUpdateOperationsInputSchema } from './DateTimeFieldUpdateOperationsInputSchema';
import { LeaguePointsUncheckedUpdateManyWithoutLeagueNestedInputSchema } from './LeaguePointsUncheckedUpdateManyWithoutLeagueNestedInputSchema';

export const LeagueUncheckedUpdateWithoutCompetitionsInputSchema: z.ZodType<Prisma.LeagueUncheckedUpdateWithoutCompetitionsInput> = z.object({
  id: z.union([ z.string().cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  description: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  leaguePoints: z.lazy(() => LeaguePointsUncheckedUpdateManyWithoutLeagueNestedInputSchema).optional()
}).strict();

export default LeagueUncheckedUpdateWithoutCompetitionsInputSchema;
