import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { UserUpdateWithoutRequestsInputSchema } from './UserUpdateWithoutRequestsInputSchema';
import { UserUncheckedUpdateWithoutRequestsInputSchema } from './UserUncheckedUpdateWithoutRequestsInputSchema';
import { UserCreateWithoutRequestsInputSchema } from './UserCreateWithoutRequestsInputSchema';
import { UserUncheckedCreateWithoutRequestsInputSchema } from './UserUncheckedCreateWithoutRequestsInputSchema';
import { UserWhereInputSchema } from './UserWhereInputSchema';

export const UserUpsertWithoutRequestsInputSchema: z.ZodType<Prisma.UserUpsertWithoutRequestsInput> = z.object({
  update: z.union([ z.lazy(() => UserUpdateWithoutRequestsInputSchema),z.lazy(() => UserUncheckedUpdateWithoutRequestsInputSchema) ]),
  create: z.union([ z.lazy(() => UserCreateWithoutRequestsInputSchema),z.lazy(() => UserUncheckedCreateWithoutRequestsInputSchema) ]),
  where: z.lazy(() => UserWhereInputSchema).optional()
}).strict();

export default UserUpsertWithoutRequestsInputSchema;
