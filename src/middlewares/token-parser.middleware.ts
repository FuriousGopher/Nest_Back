import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Response } from 'express';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class TokenParserMiddleware implements NestMiddleware {
  constructor(private readonly jwtService: JwtService) {}
  use(req, res: Response, next: NextFunction) {
    const bearerToken = req.headers.authorization?.split(' ')[1];
    const cookieHeader = req.headers.cookie;

    let refreshToken = '';
    if (cookieHeader) {
      const cookies = cookieHeader.split(';');
      for (const cookie of cookies) {
        const [name, value] = cookie.trim().split('=');
        if (name === 'refreshToken') {
          refreshToken = value;
          break;
        }
      }
    }

    let token;

    if (bearerToken) {
      token = bearerToken;
    } else if (refreshToken) {
      token = refreshToken;
    }

    if (token) {
      const decodedToken = this.jwtService.decode(token);

      if (decodedToken && decodedToken.sub) {
        req.userId = decodedToken.sub;
      }
    }

    next();
  }
}
