import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { StringFieldUpdateOperationsInputSchema } from './StringFieldUpdateOperationsInputSchema';
import { NullableStringFieldUpdateOperationsInputSchema } from './NullableStringFieldUpdateOperationsInputSchema';
import { DateTimeFieldUpdateOperationsInputSchema } from './DateTimeFieldUpdateOperationsInputSchema';
import { CompetitionUncheckedUpdateManyWithoutLeagueNestedInputSchema } from './CompetitionUncheckedUpdateManyWithoutLeagueNestedInputSchema';

export const LeagueUncheckedUpdateWithoutLeaguePointsInputSchema: z.ZodType<Prisma.LeagueUncheckedUpdateWithoutLeaguePointsInput> = z.object({
  id: z.union([ z.string().cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  description: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  competitions: z.lazy(() => CompetitionUncheckedUpdateManyWithoutLeagueNestedInputSchema).optional()
}).strict();

export default LeagueUncheckedUpdateWithoutLeaguePointsInputSchema;
