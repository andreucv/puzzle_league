import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { StringFieldUpdateOperationsInputSchema } from './StringFieldUpdateOperationsInputSchema';
import { DateTimeFieldUpdateOperationsInputSchema } from './DateTimeFieldUpdateOperationsInputSchema';
import { NullableDateTimeFieldUpdateOperationsInputSchema } from './NullableDateTimeFieldUpdateOperationsInputSchema';
import { NullableIntFieldUpdateOperationsInputSchema } from './NullableIntFieldUpdateOperationsInputSchema';
import { UserUpdateManyWithoutRecordsNestedInputSchema } from './UserUpdateManyWithoutRecordsNestedInputSchema';
import { UserUpdateOneRequiredWithoutCreatedRecordsNestedInputSchema } from './UserUpdateOneRequiredWithoutCreatedRecordsNestedInputSchema';

export const RecordUpdateWithoutCategoryInputSchema: z.ZodType<Prisma.RecordUpdateWithoutCategoryInput> = z.object({
  id: z.union([ z.string().cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  finishTime: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  tableNumber: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  users: z.lazy(() => UserUpdateManyWithoutRecordsNestedInputSchema).optional(),
  creator: z.lazy(() => UserUpdateOneRequiredWithoutCreatedRecordsNestedInputSchema).optional()
}).strict();

export default RecordUpdateWithoutCategoryInputSchema;
