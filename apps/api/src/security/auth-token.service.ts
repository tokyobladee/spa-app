import { Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";

export interface AuthTokenPayload {
  sub: string;
  email: string;
  role: string;
}

@Injectable()
export class AuthTokenService {
  constructor(private readonly jwt: JwtService) {}

  issue(payload: AuthTokenPayload): Promise<string> {
    return this.jwt.signAsync(payload);
  }
}
