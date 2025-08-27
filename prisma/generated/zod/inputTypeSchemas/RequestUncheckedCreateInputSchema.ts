import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { RoleSchema } from './RoleSchema';
import { RequestStatusSchema } from './RequestStatusSchema';

export const RequestUncheckedCreateInputSchema: z.ZodType<Prisma.RequestUncheckedCreateInput> = z.object({
  id: z.string().cuid().optional(),
  role: z.lazy(() => RoleSchema),
  status: z.lazy(() => RequestStatusSchema).optional(),
  userId: z.string(),
  competitionId: z.number().int().optional().nullable(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  reason: z.string().optional().nullable(),
  additionalInfo: z.string().optional().nullable()
}).strict();

export default RequestUncheckedCreateInputSchema;
