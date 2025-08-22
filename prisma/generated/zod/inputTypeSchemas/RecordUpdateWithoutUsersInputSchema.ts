import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { StringFieldUpdateOperationsInputSchema } from './StringFieldUpdateOperationsInputSchema';
import { DateTimeFieldUpdateOperationsInputSchema } from './DateTimeFieldUpdateOperationsInputSchema';
import { NullableDateTimeFieldUpdateOperationsInputSchema } from './NullableDateTimeFieldUpdateOperationsInputSchema';
import { NullableIntFieldUpdateOperationsInputSchema } from './NullableIntFieldUpdateOperationsInputSchema';
import { CategoryUpdateOneRequiredWithoutRecordsNestedInputSchema } from './CategoryUpdateOneRequiredWithoutRecordsNestedInputSchema';
import { UserUpdateOneRequiredWithoutCreatedRecordsNestedInputSchema } from './UserUpdateOneRequiredWithoutCreatedRecordsNestedInputSchema';

export const RecordUpdateWithoutUsersInputSchema: z.ZodType<Prisma.RecordUpdateWithoutUsersInput> = z.object({
  id: z.union([ z.string().cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  finishTime: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  tableNumber: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  category: z.lazy(() => CategoryUpdateOneRequiredWithoutRecordsNestedInputSchema).optional(),
  creator: z.lazy(() => UserUpdateOneRequiredWithoutCreatedRecordsNestedInputSchema).optional()
}).strict();

export default RecordUpdateWithoutUsersInputSchema;
