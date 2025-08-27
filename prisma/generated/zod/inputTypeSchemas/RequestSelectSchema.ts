import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { UserArgsSchema } from "../outputTypeSchemas/UserArgsSchema"
import { CompetitionArgsSchema } from "../outputTypeSchemas/CompetitionArgsSchema"

export const RequestSelectSchema: z.ZodType<Prisma.RequestSelect> = z.object({
  id: z.boolean().optional(),
  role: z.boolean().optional(),
  status: z.boolean().optional(),
  userId: z.boolean().optional(),
  competitionId: z.boolean().optional(),
  createdAt: z.boolean().optional(),
  updatedAt: z.boolean().optional(),
  reason: z.boolean().optional(),
  additionalInfo: z.boolean().optional(),
  user: z.union([z.boolean(),z.lazy(() => UserArgsSchema)]).optional(),
  competition: z.union([z.boolean(),z.lazy(() => CompetitionArgsSchema)]).optional(),
}).strict()

export default RequestSelectSchema;
