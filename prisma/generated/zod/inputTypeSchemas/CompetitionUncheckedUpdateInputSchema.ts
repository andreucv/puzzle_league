import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { IntFieldUpdateOperationsInputSchema } from './IntFieldUpdateOperationsInputSchema';
import { StringFieldUpdateOperationsInputSchema } from './StringFieldUpdateOperationsInputSchema';
import { NullableStringFieldUpdateOperationsInputSchema } from './NullableStringFieldUpdateOperationsInputSchema';
import { DateTimeFieldUpdateOperationsInputSchema } from './DateTimeFieldUpdateOperationsInputSchema';
import { CompetitionStatusSchema } from './CompetitionStatusSchema';
import { EnumCompetitionStatusFieldUpdateOperationsInputSchema } from './EnumCompetitionStatusFieldUpdateOperationsInputSchema';
import { BoolFieldUpdateOperationsInputSchema } from './BoolFieldUpdateOperationsInputSchema';
import { CategoryUncheckedUpdateManyWithoutCompetitionNestedInputSchema } from './CategoryUncheckedUpdateManyWithoutCompetitionNestedInputSchema';
import { RoleAssignmentUncheckedUpdateManyWithoutCompetitionNestedInputSchema } from './RoleAssignmentUncheckedUpdateManyWithoutCompetitionNestedInputSchema';
import { RequestUncheckedUpdateManyWithoutCompetitionNestedInputSchema } from './RequestUncheckedUpdateManyWithoutCompetitionNestedInputSchema';

export const CompetitionUncheckedUpdateInputSchema: z.ZodType<Prisma.CompetitionUncheckedUpdateInput> = z.object({
  id: z.union([ z.number().int(),z.lazy(() => IntFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  description: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  location: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  country: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  postalCode: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  image_cld_id: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  startDate: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  endDate: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  status: z.union([ z.lazy(() => CompetitionStatusSchema),z.lazy(() => EnumCompetitionStatusFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  leagueId: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  creatorId: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  registrationOpen: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  categories: z.lazy(() => CategoryUncheckedUpdateManyWithoutCompetitionNestedInputSchema).optional(),
  roleAssignments: z.lazy(() => RoleAssignmentUncheckedUpdateManyWithoutCompetitionNestedInputSchema).optional(),
  requests: z.lazy(() => RequestUncheckedUpdateManyWithoutCompetitionNestedInputSchema).optional()
}).strict();

export default CompetitionUncheckedUpdateInputSchema;
