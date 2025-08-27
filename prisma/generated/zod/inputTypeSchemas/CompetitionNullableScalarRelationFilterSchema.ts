import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { CompetitionWhereInputSchema } from './CompetitionWhereInputSchema';

export const CompetitionNullableScalarRelationFilterSchema: z.ZodType<Prisma.CompetitionNullableScalarRelationFilter> = z.object({
  is: z.lazy(() => CompetitionWhereInputSchema).optional().nullable(),
  isNot: z.lazy(() => CompetitionWhereInputSchema).optional().nullable()
}).strict();

export default CompetitionNullableScalarRelationFilterSchema;
