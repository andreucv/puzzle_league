import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { UserWhereUniqueInputSchema } from './UserWhereUniqueInputSchema';
import { UserCreateWithoutCompetitionsInputSchema } from './UserCreateWithoutCompetitionsInputSchema';
import { UserUncheckedCreateWithoutCompetitionsInputSchema } from './UserUncheckedCreateWithoutCompetitionsInputSchema';

export const UserCreateOrConnectWithoutCompetitionsInputSchema: z.ZodType<Prisma.UserCreateOrConnectWithoutCompetitionsInput> = z.object({
  where: z.lazy(() => UserWhereUniqueInputSchema),
  create: z.union([ z.lazy(() => UserCreateWithoutCompetitionsInputSchema),z.lazy(() => UserUncheckedCreateWithoutCompetitionsInputSchema) ]),
}).strict();

export default UserCreateOrConnectWithoutCompetitionsInputSchema;
