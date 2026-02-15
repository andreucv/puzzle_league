import type { Prisma } from '@prisma/client';

import { z } from 'zod';

export const PuzzleUncheckedCreateWithoutCategoriesInputSchema: z.ZodType<Prisma.PuzzleUncheckedCreateWithoutCategoriesInput> = z.object({
  id: z.string().cuid().optional(),
  name: z.string().optional().nullable(),
  pieces: z.number().int(),
  image_cld_id: z.string().optional().nullable(),
  brand: z.string(),
  serialNumber: z.string().optional().nullable(),
  barcode: z.string(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional()
}).strict();

export default PuzzleUncheckedCreateWithoutCategoriesInputSchema;
