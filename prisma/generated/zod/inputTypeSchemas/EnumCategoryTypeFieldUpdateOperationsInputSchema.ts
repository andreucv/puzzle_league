import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { CategoryTypeSchema } from './CategoryTypeSchema';

export const EnumCategoryTypeFieldUpdateOperationsInputSchema: z.ZodType<Prisma.EnumCategoryTypeFieldUpdateOperationsInput> = z.object({
  set: z.lazy(() => CategoryTypeSchema).optional()
}).strict();

export default EnumCategoryTypeFieldUpdateOperationsInputSchema;
