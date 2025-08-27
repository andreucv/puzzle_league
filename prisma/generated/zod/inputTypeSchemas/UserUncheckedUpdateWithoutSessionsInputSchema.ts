import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { StringFieldUpdateOperationsInputSchema } from './StringFieldUpdateOperationsInputSchema';
import { BoolFieldUpdateOperationsInputSchema } from './BoolFieldUpdateOperationsInputSchema';
import { NullableStringFieldUpdateOperationsInputSchema } from './NullableStringFieldUpdateOperationsInputSchema';
import { DateTimeFieldUpdateOperationsInputSchema } from './DateTimeFieldUpdateOperationsInputSchema';
import { AccountUncheckedUpdateManyWithoutUserNestedInputSchema } from './AccountUncheckedUpdateManyWithoutUserNestedInputSchema';
import { RecordUncheckedUpdateManyWithoutUsersNestedInputSchema } from './RecordUncheckedUpdateManyWithoutUsersNestedInputSchema';
import { RecordUncheckedUpdateManyWithoutCreatorNestedInputSchema } from './RecordUncheckedUpdateManyWithoutCreatorNestedInputSchema';
import { RoleAssignmentUncheckedUpdateManyWithoutUserNestedInputSchema } from './RoleAssignmentUncheckedUpdateManyWithoutUserNestedInputSchema';
import { RequestUncheckedUpdateManyWithoutUserNestedInputSchema } from './RequestUncheckedUpdateManyWithoutUserNestedInputSchema';
import { LeaguePointsUncheckedUpdateManyWithoutUserNestedInputSchema } from './LeaguePointsUncheckedUpdateManyWithoutUserNestedInputSchema';
import { CompetitionUncheckedUpdateManyWithoutCreatorNestedInputSchema } from './CompetitionUncheckedUpdateManyWithoutCreatorNestedInputSchema';

export const UserUncheckedUpdateWithoutSessionsInputSchema: z.ZodType<Prisma.UserUncheckedUpdateWithoutSessionsInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  email: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  emailVerified: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  image: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  accounts: z.lazy(() => AccountUncheckedUpdateManyWithoutUserNestedInputSchema).optional(),
  records: z.lazy(() => RecordUncheckedUpdateManyWithoutUsersNestedInputSchema).optional(),
  createdRecords: z.lazy(() => RecordUncheckedUpdateManyWithoutCreatorNestedInputSchema).optional(),
  roleAssignments: z.lazy(() => RoleAssignmentUncheckedUpdateManyWithoutUserNestedInputSchema).optional(),
  requests: z.lazy(() => RequestUncheckedUpdateManyWithoutUserNestedInputSchema).optional(),
  leaguePoints: z.lazy(() => LeaguePointsUncheckedUpdateManyWithoutUserNestedInputSchema).optional(),
  competitions: z.lazy(() => CompetitionUncheckedUpdateManyWithoutCreatorNestedInputSchema).optional()
}).strict();

export default UserUncheckedUpdateWithoutSessionsInputSchema;
