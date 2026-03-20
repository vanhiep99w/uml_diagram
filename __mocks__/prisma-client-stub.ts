/**
 * Minimal stub for @prisma/client used in tests where the Prisma client
 * has not been generated (no real DB connection needed).
 *
 * Tests that need specific Prisma behaviour should call jest.mock('@prisma/client', ...)
 * directly — that takes precedence over moduleNameMapper.
 */

class PrismaClientKnownRequestError extends Error {
  code: string
  constructor(message: string, { code }: { code: string }) {
    super(message)
    this.name = 'PrismaClientKnownRequestError'
    this.code = code
  }
}

class PrismaClientValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'PrismaClientValidationError'
  }
}

export const Prisma = {
  PrismaClientKnownRequestError,
  PrismaClientValidationError,
}

export class PrismaClient {
  userSettings = {
    findUnique: jest.fn(),
    upsert: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  }
  user = {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  }
  diagram = {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  }
}
