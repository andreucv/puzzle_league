import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { RoleSchema } from './RoleSchema';
import { RequestStatusSchema } from './RequestStatusSchema';
import { UserCreateNestedOneWithoutRequestsInputSchema } from './UserCreateNestedOneWithoutRequestsInputSchema';

export const RequestCreateWithoutCompetitionInputSchema: z.ZodType<Prisma.RequestCreateWithoutCompetitionInput> = z.object({
  id: z.string().cuid().optional(),
  role: z.lazy(() => RoleSchema),
  status: z.lazy(() => RequestStatusSchema).optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
  reason: z.string().optional().nullable(),
  additionalInfo: z.string().optional().nullable(),
  user: z.lazy(() => UserCreateNestedOneWithoutRequestsInputSchema)
}).strict();

export default RequestCreateWithoutCompetitionInputSchema;
