import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthGuard } from '@nestjs/passport';
import { JwtTokenError } from './strategy/jwt-error.const';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }
  handleRequest(err, user, info) {
    if (err) {
      throw err;
    }
    if (!user && info) {
      switch (info.message) {
        case JwtTokenError.EXPIRED:
          throw new UnauthorizedException('token het han');
        case JwtTokenError.MISSING:
          throw new UnauthorizedException("khong co token");
        case JwtTokenError.INVALID_KEY:
          throw new UnauthorizedException("token khong hop le");
        default:
          throw new UnauthorizedException(`${info.name}: ${info.message}`);
      }
    }
    return user;
  }
}
