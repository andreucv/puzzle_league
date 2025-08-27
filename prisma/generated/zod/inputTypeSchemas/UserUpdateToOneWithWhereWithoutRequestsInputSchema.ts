import type { Prisma } from '@prisma/client';

import { z } from 'zod';
import { UserWhereInputSchema } from './UserWhereInputSchema';
import { UserUpdateWithoutRequestsInputSchema } from './UserUpdateWithoutRequestsInputSchema';
import { UserUncheckedUpdateWithoutRequestsInputSchema } from './UserUncheckedUpdateWithoutRequestsInputSchema';

export const UserUpdateToOneWithWhereWithoutRequestsInputSchema: z.ZodType<Prisma.UserUpdateToOneWithWhereWithoutRequestsInput> = z.object({
  where: z.lazy(() => UserWhereInputSchema).optional(),
  data: z.union([ z.lazy(() => UserUpdateWithoutRequestsInputSchema),z.lazy(() => UserUncheckedUpdateWithoutRequestsInputSchema) ]),
}).strict();

export default UserUpdateToOneWithWhereWithoutRequestsInputSchema;
