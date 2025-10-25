import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { User } from './auth/user.entity';
import { AwsModule } from './aws/aws.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: 'cloudoverwatch.c9eys0q08frx.ap-south-1.rds.amazonaws.com',
      port: 3306,
      username: 'admin', // your MySQL username
      password: 'admin12345678', // your MySQL password
      database: 'cloudoverwatch',
      entities: [User],
      synchronize: false, // ✅ don't overwrite your existing schema
    }),
    AuthModule,AwsModule
  ],
})
export class AppModule {}
