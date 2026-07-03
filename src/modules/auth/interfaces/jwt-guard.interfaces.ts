import { FastifyRequest } from 'fastify';
import { AuthUser } from './jwt-payload.interface';

export interface AuthenticatedRequest extends FastifyRequest {
  user: AuthUser;
}
