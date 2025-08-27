import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { UserCreateWithoutLeaguePointsInputSchema } from './UserCreateWithoutLeaguePointsInputSchema';
import { UserUncheckedCreateWithoutLeaguePointsInputSchema } from './UserUncheckedCreateWithoutLeaguePointsInputSchema';
import { UserCreateOrConnectWithoutLeaguePointsInputSchema } from './UserCreateOrConnectWithoutLeaguePointsInputSchema';
import { UserUpsertWithoutLeaguePointsInputSchema } from './UserUpsertWithoutLeaguePointsInputSchema';
import { UserWhereUniqueInputSchema } from './UserWhereUniqueInputSchema';
import { UserUpdateToOneWithWhereWithoutLeaguePointsInputSchema } from './UserUpdateToOneWithWhereWithoutLeaguePointsInputSchema';
import { UserUpdateWithoutLeaguePointsInputSchema } from './UserUpdateWithoutLeaguePointsInputSchema';
import { UserUncheckedUpdateWithoutLeaguePointsInputSchema } from './UserUncheckedUpdateWithoutLeaguePointsInputSchema';

export const UserUpdateOneRequiredWithoutLeaguePointsNestedInputSchema: z.ZodType<Prisma.UserUpdateOneRequiredWithoutLeaguePointsNestedInput> = z.object({
  create: z.union([ z.lazy(() => UserCreateWithoutLeaguePointsInputSchema),z.lazy(() => UserUncheckedCreateWithoutLeaguePointsInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => UserCreateOrConnectWithoutLeaguePointsInputSchema).optional(),
  upsert: z.lazy(() => UserUpsertWithoutLeaguePointsInputSchema).optional(),
  connect: z.lazy(() => UserWhereUniqueInputSchema).optional(),
  update: z.union([ z.lazy(() => UserUpdateToOneWithWhereWithoutLeaguePointsInputSchema),z.lazy(() => UserUpdateWithoutLeaguePointsInputSchema),z.lazy(() => UserUncheckedUpdateWithoutLeaguePointsInputSchema) ]).optional(),
}).strict();

export default UserUpdateOneRequiredWithoutLeaguePointsNestedInputSchema;
