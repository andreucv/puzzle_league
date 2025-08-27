import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { UserWhereInputSchema } from './UserWhereInputSchema';
import { UserUpdateWithoutCompetitionsInputSchema } from './UserUpdateWithoutCompetitionsInputSchema';
import { UserUncheckedUpdateWithoutCompetitionsInputSchema } from './UserUncheckedUpdateWithoutCompetitionsInputSchema';

export const UserUpdateToOneWithWhereWithoutCompetitionsInputSchema: z.ZodType<Prisma.UserUpdateToOneWithWhereWithoutCompetitionsInput> = z.object({
  where: z.lazy(() => UserWhereInputSchema).optional(),
  data: z.union([ z.lazy(() => UserUpdateWithoutCompetitionsInputSchema),z.lazy(() => UserUncheckedUpdateWithoutCompetitionsInputSchema) ]),
}).strict();

export default UserUpdateToOneWithWhereWithoutCompetitionsInputSchema;
