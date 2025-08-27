import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { CompetitionStatusSchema } from './CompetitionStatusSchema';

export const EnumCompetitionStatusFieldUpdateOperationsInputSchema: z.ZodType<Prisma.EnumCompetitionStatusFieldUpdateOperationsInput> = z.object({
  set: z.lazy(() => CompetitionStatusSchema).optional()
}).strict();

export default EnumCompetitionStatusFieldUpdateOperationsInputSchema;
