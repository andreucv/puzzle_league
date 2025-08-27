import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { RoleSchema } from './RoleSchema';
import { RequestStatusSchema } from './RequestStatusSchema';

export const RequestUncheckedCreateWithoutCompetitionInputSchema: z.ZodType<Prisma.RequestUncheckedCreateWithoutCompetitionInput> = z.object({
  id: z.string().cuid().optional(),
  role: z.lazy(() => RoleSchema),
  status: z.lazy(() => RequestStatusSchema).optional(),
  userId: z.string(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  reason: z.string().optional().nullable(),
  additionalInfo: z.string().optional().nullable()
}).strict();

export default RequestUncheckedCreateWithoutCompetitionInputSchema;
