import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MetadataService } from '../metadata/metadata.service';
import { AxiosRequestConfig, AxiosResponse } from 'axios';
import { lastValueFrom, map } from 'rxjs';
import { parse, getWorkflowInstance, updateWorkflowInstanceByID } from '@nas-veridid/workflow-parser';

@Injectable()
export class VerificationService {
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly metadataService: MetadataService,
  ) { }

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

  async verify(connectionData: any): Promise<boolean> {

    const connectionId = connectionData?.connection_id;
    const threadId = connectionData?.thread_id;
    const response = await getWorkflowInstance(`${connectionId}`, 'Enroll')
    console.log("response", response);
    const instanceID = response?.instanceID;
    const instance = {
      instanceID: `${instanceID}`,
      workflowID: 'Enroll',
      connectionID: `${connectionId}`,
      currentState: 'PathwaysEnrollment',
      stateData: { "threadId": `${threadId}` }
    }
    await updateWorkflowInstanceByID(`${instanceID}`, instance)
    return true;
  }

  async handleVerifiedState(connectionData: any): Promise<void> {
    let resultOfParse: any;
    const WORKFLOWID = 'Enroll';
    const ACTIONID_VERFIED = 'verified';
    const connectionId = connectionData?.connection_id;
    const threadId = connectionData?.thread_id;

    const response = await getWorkflowInstance(`${connectionId}`, `${WORKFLOWID}`)
    console.log("response", response);

    if (response && response.stateData?.threadId === `${threadId}`) {
      // invoke parse here with new update
      const action = {
        workflowID: `${WORKFLOWID}`,
        actionID: `${ACTIONID_VERFIED}`,
        data: {},
      };
      try {
        resultOfParse = await parse(connectionId, action);
      } catch (error) {
        console.error('Error parsing workflow:', error.message);
      }
      // Send workflow response message as it is
      await this.sendMessage(connectionId, JSON.stringify(resultOfParse));
    }
    //console.log that one in here.


  }

  async handleAbandonedState(connectionData: any): Promise<void> {
    const WORKFLOWID = 'Enroll';
    const connectionId = connectionData?.connection_id;
    const threadId = connectionData?.thread_id;
    const response = await getWorkflowInstance(`${connectionId}`, `${WORKFLOWID}`)
    console.log("response", response);

    if (response && response.stateData?.threadId === `${threadId}`) {
      // invoke parse here with new update
      const message = this.configService.get<string>('REQUEST_STUDENT_TRANSCRIPT_VERIFICATION_MESSAGE')
      await this.sendMessage(connectionId, message);
    }
  }
}



