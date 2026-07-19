import { UnauthorizedException } from '@nestjs/common';
import { ClerkAuthGuard } from './clerk.guard';

describe('ClerkAuthGuard', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.CLERK_SECRET_KEY;
    delete process.env.CLERK_PUBLISHABLE_KEY;
    delete process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('rejects requests when Clerk credentials are missing', async () => {
    const guard = new ClerkAuthGuard();
    const context = {
      switchToHttp: () => ({
        getRequest: () => ({
          headers: {},
          method: 'GET',
          protocol: 'http',
          get: () => 'localhost',
          originalUrl: '/',
          url: '/',
        }),
      }),
    } as any;

    await expect(guard.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );
  });
});
