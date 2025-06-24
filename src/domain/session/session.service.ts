import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DeepPartial, Not, Repository } from "typeorm";
import { Session } from "./entities/session.entity";
import { User } from "src/domain/users/entities/user.entity";
import { FindOptions } from "src/domain/utils/types/find-options.type";
import { NullableType } from "src/domain/utils/types/nullable.type";

@Injectable()
export class SessionService {
  constructor(
    @InjectRepository(Session)
    private readonly sessionRepository: Repository<Session>,
  ) {}

  async findOne(options: FindOptions<Session>): Promise<NullableType<Session>> {
    return this.sessionRepository.findOne({
      where: options.where,
    });
  }

  async findMany(options: FindOptions<Session>): Promise<Session[]> {
    return this.sessionRepository.find({
      where: options.where,
    });
  }

  async create(data: DeepPartial<Session>): Promise<Session> {
    const session = this.sessionRepository.create(data);
    return this.sessionRepository.save(session);
  }

  async delete({
    excludeId,
    ...criteria
  }: {
    id?: Session["id"];
    user?: Pick<User, "id">;
    excludeId?: Session["id"];
  }): Promise<void> {
    await this.sessionRepository.delete({
      ...criteria,
      id: criteria.id ? criteria.id : excludeId ? Not(excludeId) : undefined,
    });
  }
}