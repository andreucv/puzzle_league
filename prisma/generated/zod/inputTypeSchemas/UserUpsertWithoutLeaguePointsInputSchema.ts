import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { UserUpdateWithoutLeaguePointsInputSchema } from './UserUpdateWithoutLeaguePointsInputSchema';
import { UserUncheckedUpdateWithoutLeaguePointsInputSchema } from './UserUncheckedUpdateWithoutLeaguePointsInputSchema';
import { UserCreateWithoutLeaguePointsInputSchema } from './UserCreateWithoutLeaguePointsInputSchema';
import { UserUncheckedCreateWithoutLeaguePointsInputSchema } from './UserUncheckedCreateWithoutLeaguePointsInputSchema';
import { UserWhereInputSchema } from './UserWhereInputSchema';

export const UserUpsertWithoutLeaguePointsInputSchema: z.ZodType<Prisma.UserUpsertWithoutLeaguePointsInput> = z.object({
  update: z.union([ z.lazy(() => UserUpdateWithoutLeaguePointsInputSchema),z.lazy(() => UserUncheckedUpdateWithoutLeaguePointsInputSchema) ]),
  create: z.union([ z.lazy(() => UserCreateWithoutLeaguePointsInputSchema),z.lazy(() => UserUncheckedCreateWithoutLeaguePointsInputSchema) ]),
  where: z.lazy(() => UserWhereInputSchema).optional()
}).strict();

export default UserUpsertWithoutLeaguePointsInputSchema;
