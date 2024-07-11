import { Module } from '@nestjs/common';
import { ConnectionController } from './connection.controller';
import { ConnectionService } from './connection.service';
import { HttpModule } from '@nestjs/axios';
import { MetadataService } from 'src/metadata/metadata.service';
import { ConfigModule } from '@nestjs/config';
import { WorkflowModule } from 'src/workflow/workflow.module';


@Module({
  imports: [HttpModule, ConfigModule, WorkflowModule],
  controllers: [ConnectionController],
  providers: [
    ConnectionService,
    MetadataService
  ],
})
export class ConnectionModule {}
