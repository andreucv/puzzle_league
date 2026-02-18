import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { StringFieldUpdateOperationsInputSchema } from './StringFieldUpdateOperationsInputSchema';
import { DateTimeFieldUpdateOperationsInputSchema } from './DateTimeFieldUpdateOperationsInputSchema';
import { NullableDateTimeFieldUpdateOperationsInputSchema } from './NullableDateTimeFieldUpdateOperationsInputSchema';
import { NullableIntFieldUpdateOperationsInputSchema } from './NullableIntFieldUpdateOperationsInputSchema';
import { InscriptionStatusSchema } from './InscriptionStatusSchema';
import { EnumInscriptionStatusFieldUpdateOperationsInputSchema } from './EnumInscriptionStatusFieldUpdateOperationsInputSchema';
import { CategoryUpdateOneRequiredWithoutRecordsNestedInputSchema } from './CategoryUpdateOneRequiredWithoutRecordsNestedInputSchema';
import { UserUpdateManyWithoutRecordsNestedInputSchema } from './UserUpdateManyWithoutRecordsNestedInputSchema';

export const RecordUpdateWithoutCreatorInputSchema: z.ZodType<Prisma.RecordUpdateWithoutCreatorInput> = z.object({
  id: z.union([ z.string().cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  finishTime: z.union([ z.coerce.date(),z.lazy(() => NullableDateTimeFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  tableNumber: z.union([ z.number().int(),z.lazy(() => NullableIntFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  status: z.union([ z.lazy(() => InscriptionStatusSchema),z.lazy(() => EnumInscriptionStatusFieldUpdateOperationsInputSchema) ]).optional(),
  category: z.lazy(() => CategoryUpdateOneRequiredWithoutRecordsNestedInputSchema).optional(),
  users: z.lazy(() => UserUpdateManyWithoutRecordsNestedInputSchema).optional()
}).strict();

export default RecordUpdateWithoutCreatorInputSchema;
