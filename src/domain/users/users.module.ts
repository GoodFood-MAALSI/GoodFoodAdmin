import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { Session } from '../session/entities/session.entity';
import { MailsModule } from '../mails/mails.module';
import { AuthValidGuard } from '../auth/guards/auth-valid.guard';
import { SuperAdminGuard } from './guards/super-admin.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Session]),
    MailsModule
  ],
  controllers: [UsersController],
  providers: [UsersService, AuthValidGuard, SuperAdminGuard],
  exports: [
    TypeOrmModule.forFeature([User]),
    UsersService,
  ],
})
export class UsersModule {}