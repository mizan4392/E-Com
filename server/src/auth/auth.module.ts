import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthGuard, ClerkService } from './AuthGuard';

@Global()
@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'admin-secret',
      signOptions: { expiresIn: '8h' },
    }),
  ],
  controllers: [],
  providers: [AuthGuard, ClerkService],
  exports: [AuthGuard, ClerkService],
})
export class AuthModule {}
