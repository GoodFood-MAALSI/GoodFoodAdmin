import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { JwtPayloadType } from 'src/domain/auth/strategies/types/jwt-payload.type';

export const User = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): JwtPayloadType => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);