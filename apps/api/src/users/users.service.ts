import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { UserEntity } from "./entities/user.entity";

export interface CommentAuthorInput {
  userName: string;
  email: string;
  homePage: string | null;
  ipAddress: string | null;
  userAgent: string | null;
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly users: Repository<UserEntity>
  ) {}

  async createAuthor(input: CommentAuthorInput): Promise<UserEntity> {
    const user = this.users.create(input);

    return this.users.save(user);
  }
}
