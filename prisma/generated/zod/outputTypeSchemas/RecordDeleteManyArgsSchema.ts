import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { RecordWhereInputSchema } from '../inputTypeSchemas/RecordWhereInputSchema'

export const RecordDeleteManyArgsSchema: z.ZodType<Prisma.RecordDeleteManyArgs> = z.object({
  where: RecordWhereInputSchema.optional(),
  limit: z.number().optional(),
}).strict() ;

export default RecordDeleteManyArgsSchema;
