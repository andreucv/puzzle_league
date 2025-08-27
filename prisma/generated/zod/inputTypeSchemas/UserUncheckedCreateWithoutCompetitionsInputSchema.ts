import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { SessionUncheckedCreateNestedManyWithoutUserInputSchema } from './SessionUncheckedCreateNestedManyWithoutUserInputSchema';
import { AccountUncheckedCreateNestedManyWithoutUserInputSchema } from './AccountUncheckedCreateNestedManyWithoutUserInputSchema';
import { RecordUncheckedCreateNestedManyWithoutUsersInputSchema } from './RecordUncheckedCreateNestedManyWithoutUsersInputSchema';
import { RecordUncheckedCreateNestedManyWithoutCreatorInputSchema } from './RecordUncheckedCreateNestedManyWithoutCreatorInputSchema';
import { RoleAssignmentUncheckedCreateNestedManyWithoutUserInputSchema } from './RoleAssignmentUncheckedCreateNestedManyWithoutUserInputSchema';
import { RequestUncheckedCreateNestedManyWithoutUserInputSchema } from './RequestUncheckedCreateNestedManyWithoutUserInputSchema';
import { LeaguePointsUncheckedCreateNestedManyWithoutUserInputSchema } from './LeaguePointsUncheckedCreateNestedManyWithoutUserInputSchema';

export const UserUncheckedCreateWithoutCompetitionsInputSchema: z.ZodType<Prisma.UserUncheckedCreateWithoutCompetitionsInput> = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  emailVerified: z.boolean(),
  image: z.string().optional().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  sessions: z.lazy(() => SessionUncheckedCreateNestedManyWithoutUserInputSchema).optional(),
  accounts: z.lazy(() => AccountUncheckedCreateNestedManyWithoutUserInputSchema).optional(),
  records: z.lazy(() => RecordUncheckedCreateNestedManyWithoutUsersInputSchema).optional(),
  createdRecords: z.lazy(() => RecordUncheckedCreateNestedManyWithoutCreatorInputSchema).optional(),
  roleAssignments: z.lazy(() => RoleAssignmentUncheckedCreateNestedManyWithoutUserInputSchema).optional(),
  requests: z.lazy(() => RequestUncheckedCreateNestedManyWithoutUserInputSchema).optional(),
  leaguePoints: z.lazy(() => LeaguePointsUncheckedCreateNestedManyWithoutUserInputSchema).optional()
}).strict();

export default UserUncheckedCreateWithoutCompetitionsInputSchema;
