import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { IntFilterSchema } from './IntFilterSchema';
import { StringFilterSchema } from './StringFilterSchema';
import { StringNullableFilterSchema } from './StringNullableFilterSchema';
import { DateTimeFilterSchema } from './DateTimeFilterSchema';
import { EnumCompetitionStatusFilterSchema } from './EnumCompetitionStatusFilterSchema';
import { CompetitionStatusSchema } from './CompetitionStatusSchema';
import { BoolFilterSchema } from './BoolFilterSchema';

export const CompetitionScalarWhereInputSchema: z.ZodType<Prisma.CompetitionScalarWhereInput> = z.object({
  AND: z.union([ z.lazy(() => CompetitionScalarWhereInputSchema),z.lazy(() => CompetitionScalarWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => CompetitionScalarWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => CompetitionScalarWhereInputSchema),z.lazy(() => CompetitionScalarWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => IntFilterSchema),z.number() ]).optional(),
  name: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  description: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  location: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  startDate: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  endDate: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  status: z.union([ z.lazy(() => EnumCompetitionStatusFilterSchema),z.lazy(() => CompetitionStatusSchema) ]).optional(),
  createdAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  updatedAt: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  leagueId: z.union([ z.lazy(() => StringNullableFilterSchema),z.string() ]).optional().nullable(),
  creatorId: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  registrationOpen: z.union([ z.lazy(() => BoolFilterSchema),z.boolean() ]).optional(),
}).strict();

export default CompetitionScalarWhereInputSchema;
