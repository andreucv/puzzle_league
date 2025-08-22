import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { UserUpdateWithoutCompetitionsInputSchema } from './UserUpdateWithoutCompetitionsInputSchema';
import { UserUncheckedUpdateWithoutCompetitionsInputSchema } from './UserUncheckedUpdateWithoutCompetitionsInputSchema';
import { UserCreateWithoutCompetitionsInputSchema } from './UserCreateWithoutCompetitionsInputSchema';
import { UserUncheckedCreateWithoutCompetitionsInputSchema } from './UserUncheckedCreateWithoutCompetitionsInputSchema';
import { UserWhereInputSchema } from './UserWhereInputSchema';

export const UserUpsertWithoutCompetitionsInputSchema: z.ZodType<Prisma.UserUpsertWithoutCompetitionsInput> = z.object({
  update: z.union([ z.lazy(() => UserUpdateWithoutCompetitionsInputSchema),z.lazy(() => UserUncheckedUpdateWithoutCompetitionsInputSchema) ]),
  create: z.union([ z.lazy(() => UserCreateWithoutCompetitionsInputSchema),z.lazy(() => UserUncheckedCreateWithoutCompetitionsInputSchema) ]),
  where: z.lazy(() => UserWhereInputSchema).optional()
}).strict();

export default UserUpsertWithoutCompetitionsInputSchema;
