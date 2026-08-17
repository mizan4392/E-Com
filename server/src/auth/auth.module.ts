import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthGuard, ClerkService } from './AuthGuard';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/user.entity';

@Global()
@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'admin-secret',
      signOptions: { expiresIn: '8h' },
    }),
    TypeOrmModule.forFeature([User]),
  ],
  controllers: [],
  providers: [AuthGuard, ClerkService],
  exports: [AuthGuard, ClerkService],
})
export class AuthModule {}
