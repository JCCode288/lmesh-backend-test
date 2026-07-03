import { ExecutionContext } from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard';
import { UnauthorizedException } from 'src/commons/exceptions/UnauthorizedException';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let jwtService: { verifyAsync: jest.Mock };

  const buildContext = (request: Record<string, any>): ExecutionContext =>
    ({
      switchToHttp: () => ({ getRequest: () => request }),
    }) as unknown as ExecutionContext;

  beforeEach(() => {
    jwtService = { verifyAsync: jest.fn() };
    guard = new JwtAuthGuard(jwtService as any);
  });

  it('rejects a request with no Authorization header', async () => {
    await expect(
      guard.canActivate(buildContext({ headers: {} })),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejects an invalid or expired token', async () => {
    jwtService.verifyAsync.mockRejectedValue(new Error('expired'));

    const ctx = buildContext({
      headers: { authorization: 'Bearer bad.token' },
    });
    await expect(guard.canActivate(ctx)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('accepts a valid token and attaches the user to the request', async () => {
    jwtService.verifyAsync.mockResolvedValue({ sub: 1, username: 'alice' });

    const request: Record<string, any> = {
      headers: { authorization: 'Bearer good.token' },
    };
    await expect(guard.canActivate(buildContext(request))).resolves.toBe(true);
    expect(request.user).toEqual({ userId: 1, username: 'alice' });
  });
});
