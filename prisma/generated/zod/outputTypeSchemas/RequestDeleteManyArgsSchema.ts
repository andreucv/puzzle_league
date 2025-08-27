import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { RequestWhereInputSchema } from '../inputTypeSchemas/RequestWhereInputSchema'

export const RequestDeleteManyArgsSchema: z.ZodType<Prisma.RequestDeleteManyArgs> = z.object({
  where: RequestWhereInputSchema.optional(),
  limit: z.number().optional(),
}).strict() ;

export default RequestDeleteManyArgsSchema;
