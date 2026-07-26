import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Request } from 'express';
import { Repository } from 'typeorm';
import { User } from '../users/user.entity';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<Request & { user?: { sub?: string } }>();
    const authHeader = request.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Admin access required');
    }

    const token = authHeader.replace('Bearer ', '');
    const payload = await this.jwtService.verifyAsync<{
      sub?: string;
      role?: string;
    }>(token, {
      secret: process.env.JWT_SECRET || 'admin-secret',
    });
    if (!payload.sub) {
      throw new UnauthorizedException('Admin access required');
    }

    const user = await this.usersRepo.findOne({ where: { id: payload.sub } });
    if (!user || user.raw?.userType !== 'admin') {
      throw new UnauthorizedException('Admin access required');
    }

    request.user = { sub: user.id };
    return true;
  }
}
