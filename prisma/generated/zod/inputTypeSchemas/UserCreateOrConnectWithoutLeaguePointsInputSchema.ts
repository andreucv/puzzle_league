import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { UserWhereUniqueInputSchema } from './UserWhereUniqueInputSchema';
import { UserCreateWithoutLeaguePointsInputSchema } from './UserCreateWithoutLeaguePointsInputSchema';
import { UserUncheckedCreateWithoutLeaguePointsInputSchema } from './UserUncheckedCreateWithoutLeaguePointsInputSchema';

export const UserCreateOrConnectWithoutLeaguePointsInputSchema: z.ZodType<Prisma.UserCreateOrConnectWithoutLeaguePointsInput> = z.object({
  where: z.lazy(() => UserWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => UserCreateWithoutLeaguePointsInputSchema),z.lazy(() => UserUncheckedCreateWithoutLeaguePointsInputSchema) ]),
}).strict();

export default UserCreateOrConnectWithoutLeaguePointsInputSchema;
