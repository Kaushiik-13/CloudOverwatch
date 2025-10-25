import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AwsService } from './aws.service';
import { AwsController } from './aws.controller';
import { User } from '../auth/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [AwsController],
  providers: [AwsService],
})
export class AwsModule {}
