import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { parse } from '@nas-veridid/workflow-parser';
import { AxiosRequestConfig } from 'axios';
import { lastValueFrom, map } from 'rxjs';




@Injectable()
export class BasicMessagesService {
 
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  async isValidJsonFormat(content: string): Promise<boolean> {
    try {
      const parsedContent = JSON.parse(content);
  
      if (typeof parsedContent.workflowID === 'string' &&
          typeof parsedContent.actionID === 'string' &&
          typeof parsedContent.data === 'object') {
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  }

  // Helper method to send a message
  private async sendMessage(connectionId: string, messageDisplayed: string): Promise<void> {
    const messageUrl = `${this.configService.get<string>('API_BASE_URL')}:8032/connections/${connectionId}/send-message`;
    const requestConfig: AxiosRequestConfig = {
      headers: {
        Authorization: `Bearer ${this.configService.get<string>('BEARER_TOKEN')}`,
        'X-API-KEY': this.configService.get<string>('API_KEY'),
      },
    };
    const messageContent = { content: messageDisplayed };

    try {
      await lastValueFrom(
        this.httpService.post(messageUrl, messageContent, requestConfig).pipe(map((resp) => resp.data))
      );
    } catch (error) {
      console.error('Error sending message:', error);
    }
  }

  // Helper method to send a proof request
  private async sendProofRequest(connectionId: string, data: object): Promise<void> { 
    const verificationRequestBody = {
     "auto_remove": true,
     "auto_verify": false,
     "connection_id": connectionId,
     "proof_request": data
    }
    const verificationRequestUrl = `${this.configService.get<string>('API_BASE_URL')}:8032/present-proof/send-request`;
    const verificationRequestConfig: AxiosRequestConfig = {
      headers: {
        'accept': 'application/json',
        'X-API-KEY': this.configService.get<string>('API_KEY'),
        'Authorization': `Bearer ${this.configService.get<string>('BEARER_TOKEN')}`,
        'Content-Type': 'application/json',
      },
    };

    try {
      await lastValueFrom(
        this.httpService.post(verificationRequestUrl, verificationRequestBody, verificationRequestConfig).pipe(map((resp) => console.log(resp.data)))
      );
    } catch (error) {
      console.error('Error sending verification request:', error);
    }
  }

  async processMessage(messageData: any): Promise<void> {


    if (await this.isValidJsonFormat(messageData.content)){
      let response: any;
      const connectionId: string = messageData.connection_id;
      const workflowID = JSON.parse(messageData.content).workflowID;
      const actionID = JSON.parse(messageData.content).actionID
      const data = JSON.parse(messageData.content).data
      const action = {
        workflowID: `${workflowID}`,
        actionID: `${actionID}`,
        data,
      };
      try {
        response = await parse(connectionId, action);
      } catch (error) {
        console.error('Error parsing workflow:', error.message);
      }
      if (response.displayData) {
        const hasAgentType = response.displayData.some((item: any) => item.type === 'agent');
        if (hasAgentType) {
          const agentItems = response.displayData.filter((item: any) => item.type === 'agent');
          for (const agentItem of agentItems) {
            if (agentItem.process === 'verification') {
              await this.sendProofRequest(connectionId, agentItem.data);
            }
          }
  
          // Filter out the content with type 'agent'
          const filteredDisplayData = response.displayData.filter((item: any) => item.type !== 'agent');
          
          // Construct modified response
          const modifiedResponse = { ...response, displayData: filteredDisplayData };
          
          // Send workflow response message with filtered displayData
          await this.sendMessage(connectionId, JSON.stringify(modifiedResponse));
        } else {
  
          // Send workflow response message as it is
          await this.sendMessage(connectionId, JSON.stringify(response));
        }
      } else {
        // Default message if no displayData
        await this.sendMessage(connectionId, "Action Menu Feature Not Available For this Connection!");
      }
    }


    // if (messageData.content === ':menu') {
    //   const connectionId: string = messageData.connection_id;
    //   let response: any;
    //   const action = {
    //     workflowID: 'root-menu',
    //     actionID: '',
    //     data: {},
    //   };
    
    //   try {
    //     response = await parse(connectionId, action);
    //   } catch (error) {
    //     console.error('Error parsing workflow:', error.message);
    //   }
    //   console.log("response", response);
    
    //   if (response.displayData) {
    //     const messageDisplayed = JSON.stringify(response);
    //     const messageUrl = `${this.configService.get<string>('API_BASE_URL')}:8032/connections/${connectionId}/send-message`;
    //     const requestConfig: AxiosRequestConfig = {
    //       headers: {
    //         Authorization: `Bearer ${this.configService.get<string>('BEARER_TOKEN')}`,
    //         'X-API-KEY': this.configService.get<string>('API_KEY'),
    //       },
    //     };
    //     const messageContent = {
    //       content: `${messageDisplayed}`,
    //     };
    //     try {
    //       await lastValueFrom(
    //         this.httpService
    //           .post(messageUrl, messageContent, requestConfig)
    //           .pipe(map((resp) => resp.data)),
    //       );
    //     } catch (error) {
    //       console.error('Error sending welcome message:', error);
    //     }
    //   } else {
    //     const messageDisplayed = "Action Menu Feature Not Available For this Connection!";
    //     const messageUrl = `${this.configService.get<string>('API_BASE_URL')}:8032/connections/${connectionId}/send-message`;
    //     const requestConfig: AxiosRequestConfig = {
    //       headers: {
    //         Authorization: `Bearer ${this.configService.get<string>('BEARER_TOKEN')}`,
    //         'X-API-KEY': this.configService.get<string>('API_KEY'),
    //       },
    //     };
    //     const messageContent = {
    //       content: `${messageDisplayed}`,
    //     };
    //     try {
    //       await lastValueFrom(
    //         this.httpService
    //           .post(messageUrl, messageContent, requestConfig)
    //           .pipe(map((resp) => resp.data)),
    //       );
    //     } catch (error) {
    //       console.error('Error sending welcome message:', error);
    //     }
    //   }
    // }


    
  }


 
}
