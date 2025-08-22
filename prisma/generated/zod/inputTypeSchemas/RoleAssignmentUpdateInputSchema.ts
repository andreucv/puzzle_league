import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { StringFieldUpdateOperationsInputSchema } from './StringFieldUpdateOperationsInputSchema';
import { RoleSchema } from './RoleSchema';
import { EnumRoleFieldUpdateOperationsInputSchema } from './EnumRoleFieldUpdateOperationsInputSchema';
import { DateTimeFieldUpdateOperationsInputSchema } from './DateTimeFieldUpdateOperationsInputSchema';
import { UserUpdateOneRequiredWithoutRoleAssignmentsNestedInputSchema } from './UserUpdateOneRequiredWithoutRoleAssignmentsNestedInputSchema';
import { CompetitionUpdateOneWithoutRoleAssignmentsNestedInputSchema } from './CompetitionUpdateOneWithoutRoleAssignmentsNestedInputSchema';

export const RoleAssignmentUpdateInputSchema: z.ZodType<Prisma.RoleAssignmentUpdateInput> = z.object({
  id: z.union([ z.string().cuid(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  role: z.union([ z.lazy(() => RoleSchema),z.lazy(() => EnumRoleFieldUpdateOperationsInputSchema) ]).optional(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  user: z.lazy(() => UserUpdateOneRequiredWithoutRoleAssignmentsNestedInputSchema).optional(),
  competition: z.lazy(() => CompetitionUpdateOneWithoutRoleAssignmentsNestedInputSchema).optional()
}).strict();

export default RoleAssignmentUpdateInputSchema;
