import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { StringFieldUpdateOperationsInputSchema } from './StringFieldUpdateOperationsInputSchema';
import { NullableStringFieldUpdateOperationsInputSchema } from './NullableStringFieldUpdateOperationsInputSchema';
import { CategoryTypeSchema } from './CategoryTypeSchema';
import { EnumCategoryTypeFieldUpdateOperationsInputSchema } from './EnumCategoryTypeFieldUpdateOperationsInputSchema';
import { NullableIntFieldUpdateOperationsInputSchema } from './NullableIntFieldUpdateOperationsInputSchema';
import { DateTimeFieldUpdateOperationsInputSchema } from './DateTimeFieldUpdateOperationsInputSchema';
import { NullableDateTimeFieldUpdateOperationsInputSchema } from './NullableDateTimeFieldUpdateOperationsInputSchema';
import { RecordUpdateManyWithoutCategoryNestedInputSchema } from './RecordUpdateManyWithoutCategoryNestedInputSchema';
import { PuzzleUpdateManyWithoutCategoriesNestedInputSchema } from './PuzzleUpdateManyWithoutCategoriesNestedInputSchema';

export const CategoryUpdateWithoutCompetitionInputSchema: z.ZodType<Prisma.CategoryUpdateWithoutCompetitionInput> = z.object({
  description: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  subname: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  type: z.union([ z.lazy(() => CategoryTypeSchema),z.lazy(() => EnumCategoryTypeFieldUpdateOperationsInputSchema) ]).optional(),
  maxPartySize: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  startTime: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  endTime: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  realStartTime: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  realEndTime: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  status: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  maxParties: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  records: z.lazy(() => RecordUpdateManyWithoutCategoryNestedInputSchema).optional(),
  puzzles: z.lazy(() => PuzzleUpdateManyWithoutCategoriesNestedInputSchema).optional()
}).strict();

export default CategoryUpdateWithoutCompetitionInputSchema;
