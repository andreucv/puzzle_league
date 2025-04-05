import { PrismaClient } from '@prisma/client';

// Initialize Prisma client
const prisma = new PrismaClient();

// User related functions
export async function getUserById(userId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true }
    });

    return user;
  } catch (error) {
    console.error('Error getting user by ID:', error);
    throw error;
  }
}

export async function createUserRecord(user: any) {
  try {
    const { uid, email, displayName, photoURL, providerId } = user;

    // Create the user
    const createdUser = await prisma.user.create({
      data: {
        id: uid,
        email,
        displayName: displayName || null,
        photoURL: photoURL || null,
        authProvider: providerId || 'password',
        profile: {
          create: {
            displayName: displayName || email?.split('@')[0] || 'User',
            bio: '',
            country: null
          }
        }
      },
      include: {
        profile: true
      }
    });

    return createdUser;
  } catch (error) {
    console.error('Error creating user record:', error);
    throw error;
  }
}

export async function updateUserProfile(userId: string, profileData: any) {
  try {
    // Update the profile
    const updatedProfile = await prisma.profile.update({
      where: { userId },
      data: profileData
    });

    // If the displayName or photoURL is being updated, update the user record too
    if (profileData.displayName || profileData.photoURL) {
      const updateData: any = {};

      if (profileData.displayName) {
        updateData.displayName = profileData.displayName;
      }

      if (profileData.photoURL) {
        updateData.photoURL = profileData.photoURL;
      }

      await prisma.user.update({
        where: { id: userId },
        data: updateData
      });
    }

    return updatedProfile;
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
}

// Session management
export async function createSession(sessionId: string, userId: string, expiresIn: number) {
  const expiresAt = new Date(Date.now() + expiresIn);

  return prisma.session.create({
    data: {
      id: sessionId,
      userId,
      expiresAt
    }
  });
}

export async function getSessionById(sessionId: string) {
  return prisma.session.findUnique({
    where: { id: sessionId }
  });
}

export async function deleteSession(sessionId: string) {
  return prisma.session.delete({
    where: { id: sessionId }
  });
}

// Participant related functions
export async function getParticipantByUserId(userId: string) {
  return prisma.participant.findFirst({
    where: { userId }
  });
}

export async function createParticipant(userId: string) {
  return prisma.participant.create({
    data: {
      userId,
      points: 0
    }
  });
}

// Export the prisma client for direct use in other files
export { prisma };
