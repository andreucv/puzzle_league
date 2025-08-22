import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { RequestStatusSchema } from './RequestStatusSchema';

export const EnumRequestStatusFieldUpdateOperationsInputSchema: z.ZodType<Prisma.EnumRequestStatusFieldUpdateOperationsInput> = z.object({
  set: z.lazy(() => RequestStatusSchema).optional()
}).strict();

export default EnumRequestStatusFieldUpdateOperationsInputSchema;
