import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { UserCreateWithoutCompetitionsInputSchema } from './UserCreateWithoutCompetitionsInputSchema';
import { UserUncheckedCreateWithoutCompetitionsInputSchema } from './UserUncheckedCreateWithoutCompetitionsInputSchema';
import { UserCreateOrConnectWithoutCompetitionsInputSchema } from './UserCreateOrConnectWithoutCompetitionsInputSchema';
import { UserUpsertWithoutCompetitionsInputSchema } from './UserUpsertWithoutCompetitionsInputSchema';
import { UserWhereUniqueInputSchema } from './UserWhereUniqueInputSchema';
import { UserUpdateToOneWithWhereWithoutCompetitionsInputSchema } from './UserUpdateToOneWithWhereWithoutCompetitionsInputSchema';
import { UserUpdateWithoutCompetitionsInputSchema } from './UserUpdateWithoutCompetitionsInputSchema';
import { UserUncheckedUpdateWithoutCompetitionsInputSchema } from './UserUncheckedUpdateWithoutCompetitionsInputSchema';

export const UserUpdateOneRequiredWithoutCompetitionsNestedInputSchema: z.ZodType<Prisma.UserUpdateOneRequiredWithoutCompetitionsNestedInput> = z.object({
  create: z.union([ z.lazy(() => UserCreateWithoutCompetitionsInputSchema),z.lazy(() => UserUncheckedCreateWithoutCompetitionsInputSchema) ]).optional(),
  connectOrCreate: z.lazy(() => UserCreateOrConnectWithoutCompetitionsInputSchema).optional(),
  upsert: z.lazy(() => UserUpsertWithoutCompetitionsInputSchema).optional(),
  connect: z.lazy(() => UserWhereUniqueInputSchema).optional(),
  update: z.union([ z.lazy(() => UserUpdateToOneWithWhereWithoutCompetitionsInputSchema),z.lazy(() => UserUpdateWithoutCompetitionsInputSchema),z.lazy(() => UserUncheckedUpdateWithoutCompetitionsInputSchema) ]).optional(),
}).strict();

export default UserUpdateOneRequiredWithoutCompetitionsNestedInputSchema;
