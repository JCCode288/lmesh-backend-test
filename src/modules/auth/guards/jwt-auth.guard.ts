import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { FastifyRequest } from 'fastify';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
import { UnauthorizedException } from 'src/commons/exceptions/UnauthorizedException';
import { AuthenticatedRequest } from '../interfaces/jwt-guard.interfaces';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}
  private readonly logger = new Logger(JwtAuthGuard.name);

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
      const token = this.extractToken(request);
      if (!token) {
        throw new UnauthorizedException('Missing authentication token');
      }

      const payload = await this.jwtService.verifyAsync<JwtPayload>(token);
      request.user = { userId: payload.sub, username: payload.username };

      return true;
    } catch (err) {
      this.logger.error(`Authentication failed.`);
      this.logger.error(err);
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  private extractToken(req: FastifyRequest): string | undefined {
    const authHeader = req.headers.authorization;
    if (!authHeader) return undefined;

    const [type, token] = authHeader.split(' ');
    return type === 'Bearer' ? token : undefined;
  }
}
