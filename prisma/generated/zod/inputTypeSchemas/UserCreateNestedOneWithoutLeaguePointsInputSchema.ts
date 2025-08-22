import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { UserCreateWithoutLeaguePointsInputSchema } from './UserCreateWithoutLeaguePointsInputSchema';
import { UserUncheckedCreateWithoutLeaguePointsInputSchema } from './UserUncheckedCreateWithoutLeaguePointsInputSchema';
import { UserCreateOrConnectWithoutLeaguePointsInputSchema } from './UserCreateOrConnectWithoutLeaguePointsInputSchema';
import { UserWhereUniqueInputSchema } from './UserWhereUniqueInputSchema';

export const UserCreateNestedOneWithoutLeaguePointsInputSchema: z.ZodType<Prisma.UserCreateNestedOneWithoutLeaguePointsInput> = z.object({
  create: z.union([ z.lazy(() => UserCreateWithoutLeaguePointsInputSchema),z.lazy(() => UserUncheckedCreateWithoutLeaguePointsInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => UserCreateOrConnectWithoutLeaguePointsInputSchema).optional(),
  connect: z.lazy(() => UserWhereUniqueInputSchema).optional()
}).strict();

export default UserCreateNestedOneWithoutLeaguePointsInputSchema;
