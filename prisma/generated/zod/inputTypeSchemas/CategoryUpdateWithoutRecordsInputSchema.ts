import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { StringFieldUpdateOperationsInputSchema } from './StringFieldUpdateOperationsInputSchema';
import { CategoryTypeSchema } from './CategoryTypeSchema';
import { EnumCategoryTypeFieldUpdateOperationsInputSchema } from './EnumCategoryTypeFieldUpdateOperationsInputSchema';
import { NullableIntFieldUpdateOperationsInputSchema } from './NullableIntFieldUpdateOperationsInputSchema';
import { DateTimeFieldUpdateOperationsInputSchema } from './DateTimeFieldUpdateOperationsInputSchema';
import { NullableDateTimeFieldUpdateOperationsInputSchema } from './NullableDateTimeFieldUpdateOperationsInputSchema';
import { CompetitionUpdateOneRequiredWithoutCategoriesNestedInputSchema } from './CompetitionUpdateOneRequiredWithoutCategoriesNestedInputSchema';
import { PuzzleUpdateManyWithoutCategoriesNestedInputSchema } from './PuzzleUpdateManyWithoutCategoriesNestedInputSchema';

export const CategoryUpdateWithoutRecordsInputSchema: z.ZodType<Prisma.CategoryUpdateWithoutRecordsInput> = z.object({
  description: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  type: z.union([ z.lazy(() => CategoryTypeSchema),z.lazy(() => EnumCategoryTypeFieldUpdateOperationsInputSchema) ]).optional(),
  maxPartySize: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  startTime: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  endTime: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  realStartTime: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  realEndTime: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  status: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  maxParties: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  competition: z.lazy(() => CompetitionUpdateOneRequiredWithoutCategoriesNestedInputSchema).optional(),
  puzzles: z.lazy(() => PuzzleUpdateManyWithoutCategoriesNestedInputSchema).optional()
}).strict();

export default CategoryUpdateWithoutRecordsInputSchema;
