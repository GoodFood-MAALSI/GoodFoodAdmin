import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DeepPartial, Repository } from "typeorm";
import { ForgotPassword } from "./entities/forgot-password.entity";
import { FindOptions } from "src/domain/utils/types/find-options.type";

@Injectable()
export class ForgotPasswordService {
  constructor(
    @InjectRepository(ForgotPassword)
    private readonly forgotPasswordRepository: Repository<ForgotPassword>,
  ) {}

  async create(data: DeepPartial<ForgotPassword>): Promise<ForgotPassword> {
    const forgotPasswordReq = this.forgotPasswordRepository.create(data);
    return this.forgotPasswordRepository.save(forgotPasswordReq);
  }

  findOne(options: FindOptions<ForgotPassword>): Promise<ForgotPassword> {
    return this.forgotPasswordRepository.findOne({
      where: options.where,
    });
  }

  async delete(id: ForgotPassword["id"]): Promise<void> {
    await this.forgotPasswordRepository.delete(id);
  }
}