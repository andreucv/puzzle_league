import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { SessionCreateNestedManyWithoutUserInputSchema } from './SessionCreateNestedManyWithoutUserInputSchema';
import { AccountCreateNestedManyWithoutUserInputSchema } from './AccountCreateNestedManyWithoutUserInputSchema';
import { RecordCreateNestedManyWithoutUsersInputSchema } from './RecordCreateNestedManyWithoutUsersInputSchema';
import { RecordCreateNestedManyWithoutCreatorInputSchema } from './RecordCreateNestedManyWithoutCreatorInputSchema';
import { RequestCreateNestedManyWithoutUserInputSchema } from './RequestCreateNestedManyWithoutUserInputSchema';
import { LeaguePointsCreateNestedManyWithoutUserInputSchema } from './LeaguePointsCreateNestedManyWithoutUserInputSchema';
import { CompetitionCreateNestedManyWithoutCreatorInputSchema } from './CompetitionCreateNestedManyWithoutCreatorInputSchema';

export const UserCreateWithoutRoleAssignmentsInputSchema: z.ZodType<Prisma.UserCreateWithoutRoleAssignmentsInput> = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  emailVerified: z.boolean(),
  image: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  postalCode: z.string().optional().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  sessions: z.lazy(() => SessionCreateNestedManyWithoutUserInputSchema).optional(),
  accounts: z.lazy(() => AccountCreateNestedManyWithoutUserInputSchema).optional(),
  records: z.lazy(() => RecordCreateNestedManyWithoutUsersInputSchema).optional(),
  createdRecords: z.lazy(() => RecordCreateNestedManyWithoutCreatorInputSchema).optional(),
  requests: z.lazy(() => RequestCreateNestedManyWithoutUserInputSchema).optional(),
  leaguePoints: z.lazy(() => LeaguePointsCreateNestedManyWithoutUserInputSchema).optional(),
  competitions: z.lazy(() => CompetitionCreateNestedManyWithoutCreatorInputSchema).optional()
}).strict();

export default UserCreateWithoutRoleAssignmentsInputSchema;
