import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

// Break the transitive import of the generated Prisma client - AuthRepository is mocked below.
jest.mock('src/modules/shared/prisma.service', () => ({
  PrismaService: class PrismaService {},
}));

import { AuthService } from './auth.service';
import { AuthRepository } from './auth.repository';
import { UnauthorizedException } from 'src/commons/exceptions/UnauthorizedException';
import { ErrorCode } from 'src/commons/enums/error-code.enums';

describe('AuthService', () => {
  let service: AuthService;
  let authRepo: { findByUsername: jest.Mock };
  let jwtService: { signAsync: jest.Mock };

  let passwordHash: string;

  beforeAll(async () => {
    passwordHash = await bcrypt.hash('password123', 10);
  });

  beforeEach(async () => {
    authRepo = { findByUsername: jest.fn() };
    jwtService = { signAsync: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: AuthRepository, useValue: authRepo },
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('validateUser', () => {
    it('returns the user without the password hash on correct credentials', async () => {
      authRepo.findByUsername.mockResolvedValue({
        id: 1,
        username: 'alice',
        password: passwordHash,
      });

      const result = await service.validateUser('alice', 'password123');

      expect(result).toEqual({ id: 1, username: 'alice' });
      expect(result).not.toHaveProperty('password');
    });

    it('throws INVALID_CREDENTIALS on a wrong password', async () => {
      authRepo.findByUsername.mockResolvedValue({
        id: 1,
        username: 'alice',
        password: passwordHash,
      });

      await expect(
        service.validateUser('alice', 'wrong'),
      ).rejects.toMatchObject({
        code: ErrorCode.INVALID_CREDENTIALS,
      });
    });

    it('throws INVALID_CREDENTIALS for an unknown user', async () => {
      authRepo.findByUsername.mockResolvedValue(null);

      await expect(
        service.validateUser('ghost', 'password123'),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });
  });

  describe('login', () => {
    it('issues a signed access token with sub and username claims', async () => {
      authRepo.findByUsername.mockResolvedValue({
        id: 7,
        username: 'bob',
        password: passwordHash,
      });
      jwtService.signAsync.mockResolvedValue('signed.jwt.token');

      const result = await service.login({
        username: 'bob',
        password: 'password123',
      });

      expect(result).toEqual({ access_token: 'signed.jwt.token' });
      expect(jwtService.signAsync).toHaveBeenCalledWith({
        sub: 7,
        username: 'bob',
      });
    });
  });
});
