import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { AxiosRequestConfig } from 'axios';
import { lastValueFrom, map } from 'rxjs';
import { parse } from '@nas-veridid/workflow-parser';

@Injectable()
export class ConnectionService {
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) { }

  async sendWelcomeMessage(connectionData: any): Promise<boolean> {
    const connectionId = connectionData.connection_id;
    const messageUrl = `${this.configService.get<string>('API_BASE_URL')}:8032/connections/${connectionId}/send-message`;

    const requestConfig: AxiosRequestConfig = {
      headers: {
        Authorization: `Bearer ${this.configService.get<string>('BEARER_TOKEN')}`,
        'X-API-KEY': this.configService.get<string>('API_KEY'),
      },
    };

    const messageContent = {
      content: this.configService.get<string>('SCHOOL_WELCOME_MESSAGE'),
    };
    try {
      await lastValueFrom(
        this.httpService
          .post(messageUrl, messageContent, requestConfig)
          .pipe(map((resp) => resp.data)),
      );
      return true;
    } catch (error) {
      console.error('Error sending welcome message:', error);
      return false;
    }
  }


  async handleActiveState(connectionData: any) {
    const connectionId: string = connectionData.connection_id;
    let response: any;
    const action = {
      workflowID: 'root-menu',
      actionID: '',
      data: {},
    };
    try {
      response = await parse(connectionId, action);
    } catch (error) {
      console.error('Error parsing workflow:', error.message);
    }
    console.log("response", response);

    if (response.displayData) {
      const messageDisplayed = JSON.stringify(response);

      const messageUrl = `${this.configService.get<string>('API_BASE_URL')}:8032/connections/${connectionId}/send-message`;
      const requestConfig: AxiosRequestConfig = {
        headers: {
          Authorization: `Bearer ${this.configService.get<string>('BEARER_TOKEN')}`,
          'X-API-KEY': this.configService.get<string>('API_KEY'),
        },
      };
      const messageContent = {
        content: `${messageDisplayed}`,
      };
      try {
        await lastValueFrom(
          this.httpService
            .post(messageUrl, messageContent, requestConfig)
            .pipe(map((resp) => resp.data)),
        );
      } catch (error) {
        console.error('Error sending welcome message:', error);
      }

    }

  }
}
