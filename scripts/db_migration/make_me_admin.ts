import { Role } from '@prisma/client'
import { prisma } from './create_prisma_client'

async function main() {
  const users = [
    {
      email: process.env.PROD_ADMIN_USER_EMAIL!,
    },
  ]

  for (const userData of users) {
    try {
        const user = await prisma.user.findUnique({
            where: {
                email: userData.email
            }
        });
        const roleAssignment = await prisma.roleAssignment.create({
            data: {
                userId: user?.id as string,
                role: 'ADMIN' as Role,
            }
        });
      console.log(`✅ Created/Updated ADMIN: ${userData.email}`)
    } catch (error) {
      console.error(`❌ Failed to create ADMIN: ${error}`)
    }
  }
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect()
  })
