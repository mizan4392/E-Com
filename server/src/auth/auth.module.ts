import { Global, Module } from '@nestjs/common';
import { AuthGuard } from './AuthGuard';
import { JwtService } from '@nestjs/jwt';

@Global()
@Module({
  imports: [],
  controllers: [],
  providers: [AuthGuard, JwtService],
  exports: [AuthGuard, JwtService],
})
export class AuthModule {}
