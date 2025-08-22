import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { UserWhereInputSchema } from './UserWhereInputSchema';
import { UserUpdateWithoutLeaguePointsInputSchema } from './UserUpdateWithoutLeaguePointsInputSchema';
import { UserUncheckedUpdateWithoutLeaguePointsInputSchema } from './UserUncheckedUpdateWithoutLeaguePointsInputSchema';

export const UserUpdateToOneWithWhereWithoutLeaguePointsInputSchema: z.ZodType<Prisma.UserUpdateToOneWithWhereWithoutLeaguePointsInput> = z.object({
  where: z.lazy(() => UserWhereInputSchema).optional(),
  data: z.union([ z.lazy(() => UserUpdateWithoutLeaguePointsInputSchema),z.lazy(() => UserUncheckedUpdateWithoutLeaguePointsInputSchema) ]),
}).strict();

export default UserUpdateToOneWithWhereWithoutLeaguePointsInputSchema;
