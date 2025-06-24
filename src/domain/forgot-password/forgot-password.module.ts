import { Module } from '@nestjs/common';
import { ForgotPasswordService } from './forgot-password.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ForgotPassword } from './entities/forgot-password.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ForgotPassword])],
  providers: [ForgotPasswordService],
  exports: [ForgotPasswordService],
})
export class ForgotPasswordModule {}