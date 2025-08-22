import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { UserCreateWithoutCompetitionsInputSchema } from './UserCreateWithoutCompetitionsInputSchema';
import { UserUncheckedCreateWithoutCompetitionsInputSchema } from './UserUncheckedCreateWithoutCompetitionsInputSchema';
import { UserCreateOrConnectWithoutCompetitionsInputSchema } from './UserCreateOrConnectWithoutCompetitionsInputSchema';
import { UserWhereUniqueInputSchema } from './UserWhereUniqueInputSchema';

export const UserCreateNestedOneWithoutCompetitionsInputSchema: z.ZodType<Prisma.UserCreateNestedOneWithoutCompetitionsInput> = z.object({
  create: z.union([ z.lazy(() => UserCreateWithoutCompetitionsInputSchema),z.lazy(() => UserUncheckedCreateWithoutCompetitionsInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => UserCreateOrConnectWithoutCompetitionsInputSchema).optional(),
  connect: z.lazy(() => UserWhereUniqueInputSchema).optional()
}).strict();

export default UserCreateNestedOneWithoutCompetitionsInputSchema;
