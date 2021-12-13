
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';



@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {

  static expirationsSeconds:number = 60 * 60 * 24 * 10000; // Время сессии в секундах
  static ttl_limit:number = 2000; // Максимальное количество запросов в интервале с одного ip
  static ttl:number = 10; // Интервал в секундах для максимального количества запросов


  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_SECRET')
    });
  }

  async validate(payload: any) {
    return { ...payload, };
  }
}
