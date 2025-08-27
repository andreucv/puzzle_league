import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { RequestSelectSchema } from '../inputTypeSchemas/RequestSelectSchema';
import { RequestIncludeSchema } from '../inputTypeSchemas/RequestIncludeSchema';

export const RequestArgsSchema: z.ZodType<Prisma.RequestDefaultArgs> = z.object({
  select: z.lazy(() => RequestSelectSchema).optional(),
  include: z.lazy(() => RequestIncludeSchema).optional(),
}).strict();

export default RequestArgsSchema;
