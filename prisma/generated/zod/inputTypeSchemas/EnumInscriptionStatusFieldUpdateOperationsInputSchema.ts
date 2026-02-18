import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { InscriptionStatusSchema } from './InscriptionStatusSchema';

export const EnumInscriptionStatusFieldUpdateOperationsInputSchema: z.ZodType<Prisma.EnumInscriptionStatusFieldUpdateOperationsInput> = z.object({
  set: z.lazy(() => InscriptionStatusSchema).optional()
}).strict();

export default EnumInscriptionStatusFieldUpdateOperationsInputSchema;
