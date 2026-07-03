jest.mock('generated/prisma/client', () => ({ PrismaClient: class PrismaClient { } }));
jest.mock('@prisma/adapter-pg', () => ({ PrismaPg: class PrismaPg { } }));

import { PrismaService } from './prisma.service';

describe('PrismaService', () => {
    it('should be defined', () => {
        const config = { getOrThrow: jest.fn().mockReturnValue('postgresql://localhost/db') };
        expect(new PrismaService(config as any)).toBeDefined();
    });
});
