// verification.module.ts
import { Module } from '@nestjs/common';
import { VerificationController } from './verification.controller';
import { VerificationService } from './verification.service';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { MetadataModule } from '../metadata/metadata.module';

@Module({
  imports: [HttpModule, ConfigModule, MetadataModule], 
  controllers: [VerificationController],
  providers: [VerificationService],
})
export class VerificationModule {}
