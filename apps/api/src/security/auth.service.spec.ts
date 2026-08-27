import { ConflictException, UnauthorizedException } from "@nestjs/common";
import type { ConfigService } from "@nestjs/config";
import bcrypt from "bcryptjs";
import type { Repository } from "typeorm";
import { AuthService } from "./auth.service";
import type { AuthTokenService } from "./auth-token.service";
import type { AuthUserEntity } from "./entities/auth-user.entity";

jest.mock("@nestjs/jwt", () => ({
  JwtService: class JwtService {}
}));

describe("AuthService", () => {
  const bootstrapToken = "local-bootstrap-token";

  function buildService(existingUser: AuthUserEntity | null = null) {
    const savedUsers: AuthUserEntity[] = [];
    const findOne = jest.fn(() => Promise.resolve(existingUser));
    const issue = jest.fn(() => Promise.resolve("jwt-token"));
    const repository = {
      findOne,
      create: jest.fn((input: Partial<AuthUserEntity>) => ({ id: "auth-user-id", ...input })),
      save: jest.fn((user: AuthUserEntity) => {
        savedUsers.push(user);
        return Promise.resolve(user);
      })
    } as unknown as jest.Mocked<Repository<AuthUserEntity>>;
    const tokens = {
      issue
    } as unknown as jest.Mocked<AuthTokenService>;
    const config = {
      getOrThrow: jest.fn(() => bootstrapToken)
    } as unknown as jest.Mocked<ConfigService>;

    return {
      service: new AuthService(repository, tokens, config),
      findOne,
      issue,
      savedUsers
    };
  }

  it("bootstraps an admin with a hashed password and issued token", async () => {
    const { service, findOne, issue, savedUsers } = buildService();

    const result = await service.bootstrapAdmin("Admin@Example.com", "securePassword12", bootstrapToken);

    expect(findOne).toHaveBeenCalledWith({ where: { email: "admin@example.com" } });
    expect(savedUsers[0]).toBeDefined();
    expect(await bcrypt.compare("securePassword12", savedUsers[0]!.passwordHash)).toBe(true);
    expect(issue).toHaveBeenCalledWith({
      sub: "auth-user-id",
      email: "admin@example.com",
      role: "admin"
    });
    expect(result).toEqual({
      accessToken: "jwt-token",
      user: {
        id: "auth-user-id",
        email: "admin@example.com",
        role: "admin"
      }
    });
  });

  it("rejects invalid bootstrap tokens", async () => {
    const { service } = buildService();

    await expect(service.bootstrapAdmin("admin@example.com", "securePassword12", "wrong-token")).rejects.toBeInstanceOf(
      UnauthorizedException
    );
  });

  it("rejects duplicate admin emails", async () => {
    const existing = {
      id: "existing-id",
      email: "admin@example.com",
      passwordHash: "hash",
      role: "admin"
    } as AuthUserEntity;
    const { service } = buildService(existing);

    await expect(service.bootstrapAdmin("admin@example.com", "securePassword12", bootstrapToken)).rejects.toBeInstanceOf(
      ConflictException
    );
  });

  it("logs in valid users", async () => {
    const passwordHash = await bcrypt.hash("securePassword12", 12);
    const existing = {
      id: "existing-id",
      email: "admin@example.com",
      passwordHash,
      role: "admin"
    } as AuthUserEntity;
    const { service, issue } = buildService(existing);

    const result = await service.login("Admin@Example.com", "securePassword12");

    expect(issue).toHaveBeenCalledWith({
      sub: "existing-id",
      email: "admin@example.com",
      role: "admin"
    });
    expect(result.accessToken).toBe("jwt-token");
  });

  it("rejects invalid credentials", async () => {
    const passwordHash = await bcrypt.hash("securePassword12", 12);
    const existing = {
      id: "existing-id",
      email: "admin@example.com",
      passwordHash,
      role: "admin"
    } as AuthUserEntity;
    const { service } = buildService(existing);

    await expect(service.login("admin@example.com", "wrong-password")).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
