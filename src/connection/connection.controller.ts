import { Controller, Post, Body, Res, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { ConnectionService } from './connection.service';
import { ConfigService } from '@nestjs/config';
import { MetadataService } from '../metadata/metadata.service';

@Controller()
export class ConnectionController {
  constructor(
    private readonly connectionService: ConnectionService,
    private readonly configService: ConfigService,
    private readonly metadataService: MetadataService,
    ) {}

  @Post('/')
  async handleConnection(
    @Body() connectionData: any,
    @Res() response: Response,
  ): Promise<Response> {
    console.log('************* Connection controller ***************');
    console.log(connectionData);

    try {
      if (connectionData.state === 'request') {
        console.log('Current status is request.');
      } else if (connectionData.state === 'active') {
        console.log('Connection is active.');
        // await this.handleActiveState(connectionData)
        await this.connectionService.handleActiveState(connectionData)
      }
      return response
        .status(HttpStatus.OK)
        .send('Connection request handled successfully');
    } catch (error) {
      console.error('Error handling connection request:', error);
      return response
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .send('Failed to handle connection request');
    }
  }
}
