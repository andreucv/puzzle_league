import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { StringFieldUpdateOperationsInputSchema } from './StringFieldUpdateOperationsInputSchema';
import { NullableStringFieldUpdateOperationsInputSchema } from './NullableStringFieldUpdateOperationsInputSchema';
import { DateTimeFieldUpdateOperationsInputSchema } from './DateTimeFieldUpdateOperationsInputSchema';
import { CompetitionStatusSchema } from './CompetitionStatusSchema';
import { EnumCompetitionStatusFieldUpdateOperationsInputSchema } from './EnumCompetitionStatusFieldUpdateOperationsInputSchema';
import { BoolFieldUpdateOperationsInputSchema } from './BoolFieldUpdateOperationsInputSchema';
import { LeagueUpdateOneWithoutCompetitionsNestedInputSchema } from './LeagueUpdateOneWithoutCompetitionsNestedInputSchema';
import { CategoryUpdateManyWithoutCompetitionNestedInputSchema } from './CategoryUpdateManyWithoutCompetitionNestedInputSchema';
import { RoleAssignmentUpdateManyWithoutCompetitionNestedInputSchema } from './RoleAssignmentUpdateManyWithoutCompetitionNestedInputSchema';
import { UserUpdateOneRequiredWithoutCompetitionsNestedInputSchema } from './UserUpdateOneRequiredWithoutCompetitionsNestedInputSchema';

export const CompetitionUpdateWithoutRequestsInputSchema: z.ZodType<Prisma.CompetitionUpdateWithoutRequestsInput> = z.object({
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
  registrationOpen: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  league: z.lazy(() => LeagueUpdateOneWithoutCompetitionsNestedInputSchema).optional(),
  categories: z.lazy(() => CategoryUpdateManyWithoutCompetitionNestedInputSchema).optional(),
  roleAssignments: z.lazy(() => RoleAssignmentUpdateManyWithoutCompetitionNestedInputSchema).optional(),
  creator: z.lazy(() => UserUpdateOneRequiredWithoutCompetitionsNestedInputSchema).optional()
}).strict();

export default CompetitionUpdateWithoutRequestsInputSchema;
