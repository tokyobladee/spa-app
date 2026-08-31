import { ConflictException, Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectRepository } from "@nestjs/typeorm";
import bcrypt from "bcryptjs";
import { Repository } from "typeorm";
import { AuthTokenService } from "./auth-token.service";
import { AuthUserEntity } from "./entities/auth-user.entity";

export interface AuthResponse {
  accessToken: string;
  user: AuthUserResponse;
}

export interface AuthUserResponse {
  id: string;
  email: string;
  role: string;
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(AuthUserEntity)
    private readonly authUsers: Repository<AuthUserEntity>,
    private readonly tokens: AuthTokenService,
    private readonly config: ConfigService
  ) {}

  async bootstrapAdmin(email: string, password: string, bootstrapToken: string): Promise<AuthResponse> {
    if (bootstrapToken !== this.config.getOrThrow<string>("app.adminBootstrapToken")) {
      throw new UnauthorizedException("Bootstrap token is invalid");
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existing = await this.authUsers.findOne({ where: { email: normalizedEmail } });

    if (existing) {
      throw new ConflictException("Admin user already exists");
    }

    const user = await this.authUsers.save(
      this.authUsers.create({
        email: normalizedEmail,
        passwordHash: await bcrypt.hash(password, 12),
        role: "admin"
      })
    );

    return this.toAuthResponse(user);
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    const user = await this.authUsers.findOne({ where: { email: email.toLowerCase().trim() } });

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      throw new UnauthorizedException("Credentials are invalid");
    }

    return this.toAuthResponse(user);
  }

  toUserResponse(user: AuthUserEntity): AuthUserResponse {
    return {
      id: user.id,
      email: user.email,
      role: user.role
    };
  }

  private async toAuthResponse(user: AuthUserEntity): Promise<AuthResponse> {
    return {
      accessToken: await this.tokens.issue({
        sub: user.id,
        email: user.email,
        role: user.role
      }),
      user: this.toUserResponse(user)
    };
  }
}
