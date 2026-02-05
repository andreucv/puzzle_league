import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { StringFieldUpdateOperationsInputSchema } from './StringFieldUpdateOperationsInputSchema';
import { BoolFieldUpdateOperationsInputSchema } from './BoolFieldUpdateOperationsInputSchema';
import { NullableStringFieldUpdateOperationsInputSchema } from './NullableStringFieldUpdateOperationsInputSchema';
import { DateTimeFieldUpdateOperationsInputSchema } from './DateTimeFieldUpdateOperationsInputSchema';
import { SessionUncheckedUpdateManyWithoutUserNestedInputSchema } from './SessionUncheckedUpdateManyWithoutUserNestedInputSchema';
import { AccountUncheckedUpdateManyWithoutUserNestedInputSchema } from './AccountUncheckedUpdateManyWithoutUserNestedInputSchema';
import { RecordUncheckedUpdateManyWithoutCreatorNestedInputSchema } from './RecordUncheckedUpdateManyWithoutCreatorNestedInputSchema';
import { RoleAssignmentUncheckedUpdateManyWithoutUserNestedInputSchema } from './RoleAssignmentUncheckedUpdateManyWithoutUserNestedInputSchema';
import { RequestUncheckedUpdateManyWithoutUserNestedInputSchema } from './RequestUncheckedUpdateManyWithoutUserNestedInputSchema';
import { LeaguePointsUncheckedUpdateManyWithoutUserNestedInputSchema } from './LeaguePointsUncheckedUpdateManyWithoutUserNestedInputSchema';
import { CompetitionUncheckedUpdateManyWithoutCreatorNestedInputSchema } from './CompetitionUncheckedUpdateManyWithoutCreatorNestedInputSchema';

export const UserUncheckedUpdateWithoutRecordsInputSchema: z.ZodType<Prisma.UserUncheckedUpdateWithoutRecordsInput> = z.object({
  id: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  name: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  email: z.union([ z.string(),z.lazy(() => StringFieldUpdateOperationsInputSchema) ]).optional(),
  emailVerified: z.union([ z.boolean(),z.lazy(() => BoolFieldUpdateOperationsInputSchema) ]).optional(),
  image: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  country: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  postalCode: z.union([ z.string(),z.lazy(() => NullableStringFieldUpdateOperationsInputSchema) ]).optional().nullable(),
  createdAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  updatedAt: z.union([ z.coerce.date(),z.lazy(() => DateTimeFieldUpdateOperationsInputSchema) ]).optional(),
  sessions: z.lazy(() => SessionUncheckedUpdateManyWithoutUserNestedInputSchema).optional(),
  accounts: z.lazy(() => AccountUncheckedUpdateManyWithoutUserNestedInputSchema).optional(),
  createdRecords: z.lazy(() => RecordUncheckedUpdateManyWithoutCreatorNestedInputSchema).optional(),
  roleAssignments: z.lazy(() => RoleAssignmentUncheckedUpdateManyWithoutUserNestedInputSchema).optional(),
  requests: z.lazy(() => RequestUncheckedUpdateManyWithoutUserNestedInputSchema).optional(),
  leaguePoints: z.lazy(() => LeaguePointsUncheckedUpdateManyWithoutUserNestedInputSchema).optional(),
  competitions: z.lazy(() => CompetitionUncheckedUpdateManyWithoutCreatorNestedInputSchema).optional()
}).strict();

export default UserUncheckedUpdateWithoutRecordsInputSchema;
