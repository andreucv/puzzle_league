import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { SessionCreateNestedManyWithoutUserInputSchema } from './SessionCreateNestedManyWithoutUserInputSchema';
import { AccountCreateNestedManyWithoutUserInputSchema } from './AccountCreateNestedManyWithoutUserInputSchema';
import { RecordCreateNestedManyWithoutUsersInputSchema } from './RecordCreateNestedManyWithoutUsersInputSchema';
import { RecordCreateNestedManyWithoutCreatorInputSchema } from './RecordCreateNestedManyWithoutCreatorInputSchema';
import { RoleAssignmentCreateNestedManyWithoutUserInputSchema } from './RoleAssignmentCreateNestedManyWithoutUserInputSchema';
import { RequestCreateNestedManyWithoutUserInputSchema } from './RequestCreateNestedManyWithoutUserInputSchema';
import { CompetitionCreateNestedManyWithoutCreatorInputSchema } from './CompetitionCreateNestedManyWithoutCreatorInputSchema';

export const UserCreateWithoutLeaguePointsInputSchema: z.ZodType<Prisma.UserCreateWithoutLeaguePointsInput> = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  emailVerified: z.boolean(),
  image: z.string().optional().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  sessions: z.lazy(() => SessionCreateNestedManyWithoutUserInputSchema).optional(),
  accounts: z.lazy(() => AccountCreateNestedManyWithoutUserInputSchema).optional(),
  records: z.lazy(() => RecordCreateNestedManyWithoutUsersInputSchema).optional(),
  createdRecords: z.lazy(() => RecordCreateNestedManyWithoutCreatorInputSchema).optional(),
  roleAssignments: z.lazy(() => RoleAssignmentCreateNestedManyWithoutUserInputSchema).optional(),
  requests: z.lazy(() => RequestCreateNestedManyWithoutUserInputSchema).optional(),
  competitions: z.lazy(() => CompetitionCreateNestedManyWithoutCreatorInputSchema).optional()
}).strict();

export default UserCreateWithoutLeaguePointsInputSchema;
