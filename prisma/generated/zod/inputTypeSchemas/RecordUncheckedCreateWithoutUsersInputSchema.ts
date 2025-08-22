import type { Prisma } from '@prisma/client';

import { z } from 'zod';

export const RecordUncheckedCreateWithoutUsersInputSchema: z.ZodType<Prisma.RecordUncheckedCreateWithoutUsersInput> = z.object({
  id: z.string().cuid().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  finishTime: z.coerce.date().optional().nullable(),
  tableNumber: z.number().int().optional().nullable(),
  categoryId: z.number().int(),
  creatorId: z.string()
}).strict();

export default RecordUncheckedCreateWithoutUsersInputSchema;
