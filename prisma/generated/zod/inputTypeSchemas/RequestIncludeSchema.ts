import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { UserArgsSchema } from "../outputTypeSchemas/UserArgsSchema"
import { CompetitionArgsSchema } from "../outputTypeSchemas/CompetitionArgsSchema"

export const RequestIncludeSchema: z.ZodType<Prisma.RequestInclude> = z.object({
  user: z.union([z.boolean(),z.lazy(() => UserArgsSchema)]).optional(),
  competition: z.union([z.boolean(),z.lazy(() => CompetitionArgsSchema)]).optional(),
}).strict()

export default RequestIncludeSchema;
