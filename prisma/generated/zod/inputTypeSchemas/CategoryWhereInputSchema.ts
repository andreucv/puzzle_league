import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { IntFilterSchema } from './IntFilterSchema';
import { StringFilterSchema } from './StringFilterSchema';
import { EnumCategoryTypeFilterSchema } from './EnumCategoryTypeFilterSchema';
import { CategoryTypeSchema } from './CategoryTypeSchema';
import { IntNullableFilterSchema } from './IntNullableFilterSchema';
import { DateTimeFilterSchema } from './DateTimeFilterSchema';
import { DateTimeNullableFilterSchema } from './DateTimeNullableFilterSchema';
import { CompetitionScalarRelationFilterSchema } from './CompetitionScalarRelationFilterSchema';
import { CompetitionWhereInputSchema } from './CompetitionWhereInputSchema';
import { RecordListRelationFilterSchema } from './RecordListRelationFilterSchema';
import { PuzzleListRelationFilterSchema } from './PuzzleListRelationFilterSchema';

export const CategoryWhereInputSchema: z.ZodType<Prisma.CategoryWhereInput> = z.object({
  AND: z.union([ z.lazy(() => CategoryWhereInputSchema),z.lazy(() => CategoryWhereInputSchema).array() ]).optional(),
  OR: z.lazy(() => CategoryWhereInputSchema).array().optional(),
  NOT: z.union([ z.lazy(() => CategoryWhereInputSchema),z.lazy(() => CategoryWhereInputSchema).array() ]).optional(),
  id: z.union([ z.lazy(() => IntFilterSchema),z.number() ]).optional(),
  description: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  type: z.union([ z.lazy(() => EnumCategoryTypeFilterSchema),z.lazy(() => CategoryTypeSchema) ]).optional(),
  maxPartySize: z.union([ z.lazy(() => IntNullableFilterSchema),z.number() ]).optional().nullable(),
  startTime: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  endTime: z.union([ z.lazy(() => DateTimeFilterSchema),z.coerce.date() ]).optional(),
  realStartTime: z.union([ z.lazy(() => DateTimeNullableFilterSchema),z.coerce.date() ]).optional().nullable(),
  realEndTime: z.union([ z.lazy(() => DateTimeNullableFilterSchema),z.coerce.date() ]).optional().nullable(),
  status: z.union([ z.lazy(() => StringFilterSchema),z.string() ]).optional(),
  maxParties: z.union([ z.lazy(() => IntNullableFilterSchema),z.number() ]).optional().nullable(),
  competitionId: z.union([ z.lazy(() => IntFilterSchema),z.number() ]).optional(),
  competition: z.union([ z.lazy(() => CompetitionScalarRelationFilterSchema),z.lazy(() => CompetitionWhereInputSchema) ]).optional(),
  records: z.lazy(() => RecordListRelationFilterSchema).optional(),
  puzzles: z.lazy(() => PuzzleListRelationFilterSchema).optional()
}).strict();

export default CategoryWhereInputSchema;
