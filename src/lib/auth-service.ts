import { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';
import { hashPassword, verifyPassword } from '@/lib/auth-utils';

export class DuplicateEmailError extends Error {
  constructor(email: string) {
    super('DuplicateEmailError');
    this.name = 'DuplicateEmailError';
    Object.defineProperty(this, 'email', { value: email });
  }
}

export async function createUser(
  email: string,
  password: string,
  name?: string
): Promise<{ id: string; email: string }> {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new DuplicateEmailError(email);
  }

  const hashedPassword = await hashPassword(password);

  try {
    const user = await prisma.user.create({
      data: { email, password: hashedPassword, name: name ?? null },
    });

    return { id: user.id, email: user.email };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new DuplicateEmailError(email);
    }
    throw error;
  }
}

export async function authorizeCredentials(credentials: {
  email: string;
  password: string;
}): Promise<{ id: string; email: string } | null> {
  const user = await prisma.user.findUnique({ where: { email: credentials.email } });
  if (!user) {
    return null;
  }

  const valid = await verifyPassword(credentials.password, user.password);
  if (!valid) {
    return null;
  }

  return { id: user.id, email: user.email };
}
