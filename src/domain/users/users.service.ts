import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository } from 'typeorm';
import { User, UserStatus, UserRole } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { Session } from '../session/entities/session.entity';
import { EntityCondition } from '../utils/types/entity-condition.type';
import { NullableType } from '../utils/types/nullable.type';
import { MailsService } from '../mails/mails.service';
import { CreateAdminUserDto } from './dto/create-admin-user.dto';
import { randomStringGenerator } from '@nestjs/common/utils/random-string-generator.util';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Session)
    private readonly sessionRepository: Repository<Session>,
    private readonly mailsService: MailsService,
  ) {}

  async createUser(createUserDto: CreateUserDto): Promise<User> {
    const existingUser = await this.usersRepository.findOne({
      where: { email: createUserDto.email },
    });
    if (existingUser)
      throw new HttpException('User already exists', HttpStatus.CONFLICT);
    const user = this.usersRepository.create(createUserDto);
    return this.usersRepository.save(user);
  }

  async createUserWithPasswordEmail(createUserDto: CreateAdminUserDto): Promise<string> {
    const existingUser = await this.usersRepository.findOne({
      where: { email: createUserDto.email },
    });
    if (existingUser)
      throw new HttpException('User already exists', HttpStatus.CONFLICT);

    const password = randomStringGenerator();

    const user = this.usersRepository.create({
      ...createUserDto,
      password,
      status: UserStatus.Active,
      force_password_change: true,
      role: UserRole.Admin,
    });

    await this.usersRepository.save(user);

    await this.mailsService.sendUserCredentials({
      to: createUserDto.email,
      data: {
        user: `${createUserDto.last_name} ${createUserDto.first_name}`,
        password,
      },
    });

    return "Utilisateur créé avec succès. Un email avec les identifiants a été envoyé.";
  }

  async findOneUser(options: EntityCondition<User>): Promise<NullableType<User>> {
    const user = await this.usersRepository.findOne({
      where: options,
    });
    return user;
  }

  async updateUser(id: User['id'], payload: DeepPartial<User>): Promise<User> {
    return this.usersRepository.save(
      this.usersRepository.create({
        id,
        ...payload,
      }),
    );
  }

  async deleteUser(id: User['id']): Promise<{ message: string }> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) throw new HttpException('User not found', HttpStatus.NOT_FOUND);

    await this.sessionRepository.delete({ user: { id } });
    await this.usersRepository.delete(id);

    return { message: "L'utilisateur a été supprimé avec succès" };
  }

  async saveUser(user: User): Promise<User> {
    return this.usersRepository.save(user);
  }
}