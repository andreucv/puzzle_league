import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { StringFieldUpdateOperationsInputSchema } from './StringFieldUpdateOperationsInputSchema';
import { BoolFieldUpdateOperationsInputSchema } from './BoolFieldUpdateOperationsInputSchema';
import { NullableStringFieldUpdateOperationsInputSchema } from './NullableStringFieldUpdateOperationsInputSchema';
import { DateTimeFieldUpdateOperationsInputSchema } from './DateTimeFieldUpdateOperationsInputSchema';
import { SessionUpdateManyWithoutUserNestedInputSchema } from './SessionUpdateManyWithoutUserNestedInputSchema';
import { AccountUpdateManyWithoutUserNestedInputSchema } from './AccountUpdateManyWithoutUserNestedInputSchema';
import { RecordUpdateManyWithoutUsersNestedInputSchema } from './RecordUpdateManyWithoutUsersNestedInputSchema';
import { RecordUpdateManyWithoutCreatorNestedInputSchema } from './RecordUpdateManyWithoutCreatorNestedInputSchema';
import { RoleAssignmentUpdateManyWithoutUserNestedInputSchema } from './RoleAssignmentUpdateManyWithoutUserNestedInputSchema';
import { LeaguePointsUpdateManyWithoutUserNestedInputSchema } from './LeaguePointsUpdateManyWithoutUserNestedInputSchema';
import { CompetitionUpdateManyWithoutCreatorNestedInputSchema } from './CompetitionUpdateManyWithoutCreatorNestedInputSchema';

export const UserUpdateWithoutRequestsInputSchema: z.ZodType<Prisma.UserUpdateWithoutRequestsInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  email: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  emailVerified: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  image: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  sessions: z.lazy(() => SessionUpdateManyWithoutUserNestedInputSchema).optional(),
  accounts: z.lazy(() => AccountUpdateManyWithoutUserNestedInputSchema).optional(),
  records: z.lazy(() => RecordUpdateManyWithoutUsersNestedInputSchema).optional(),
  createdRecords: z.lazy(() => RecordUpdateManyWithoutCreatorNestedInputSchema).optional(),
  roleAssignments: z.lazy(() => RoleAssignmentUpdateManyWithoutUserNestedInputSchema).optional(),
  leaguePoints: z.lazy(() => LeaguePointsUpdateManyWithoutUserNestedInputSchema).optional(),
  competitions: z.lazy(() => CompetitionUpdateManyWithoutCreatorNestedInputSchema).optional()
}).strict();

export default UserUpdateWithoutRequestsInputSchema;
