import { Subject } from "rxjs";
import { IAIConfig, ISettings, Utilities } from "./utility-classes";
import OpenAI from 'openai';
import Groq from 'groq-sdk';
import Anthropic from '@anthropic-ai/sdk';

import fs from 'fs';
import { ipcMain } from "electron";

export interface IChatServiceResponse {
  status: 'SUCCESS' | 'FAILURE';
  text: string;
  error?: any;
}

export interface IGenericMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface IGenericAnthroMessage {
  role: 'user' | 'assistant';
  content: string;
}
export class ModelEngine {
  log$ = new Subject<{
    level: 'trace' | 'info' | 'important';
    message: string;
  }>();
  error$ = new Subject<string>();

  constructor(public getSettings: () => ISettings) {
    ipcMain.handle('transcribe', async (undefined, audioFilePath: string): Promise<IChatServiceResponse> => this.transcribe(audioFilePath));
    ipcMain.handle(
      'interaction-request',
      async (undefined, systemMessage: string, humanMessage: string): Promise<IChatServiceResponse> =>
         this.interactionRequest(systemMessage, humanMessage));
    ipcMain.handle(
      'llm-request',
      async (undefined, messageStack: IGenericMessage[]): Promise<IChatServiceResponse> =>
          this.llmRequest(messageStack));
  }

  transcribe(audioFilePath: string): Promise<IChatServiceResponse> {
    try {
      const settings = this.getSettings()
      const provider = settings.defaultTranscribeProvider;
      let llm = settings.AIConfigs.find((llm) => llm.provider === provider);

      if (!this.valid(llm)) {
          llm = settings.AIConfigs.find((llm) => llm.transcribe && this.valid(llm) )
      }
      if (this.valid(llm)) {
          if (llm!.provider == Utilities.OPENAI) {
            return this.openAiTranscribe(audioFilePath, llm!.apiKey);
          } else if (llm!.provider === Utilities.GROQ) {
            return this.groqTranscribe(audioFilePath, llm!.apiKey);
          }
      }
    } catch (error) {
      this.error$.next(`${error}`);
      return new Promise((resolve) => ModelEngine.err(error));
    }

    const message = 'Unable to transcribe audio.  No LLM configured to perform audio transcription exists with an API key';
    this.error$.next(message);
    return new Promise((resolve) => ModelEngine.err(new Error(message)));
  }

  async openAiTranscribe(audioFile: string, apiKey: string): Promise<IChatServiceResponse> {
    try {
      const openai = new OpenAI({
        apiKey: apiKey,
      });

      const transcript = await openai.audio.transcriptions.create({
        file: fs.createReadStream(audioFile),
        model: 'whisper-1',
        language: 'en', // this is optional but helps the model
      });
      return ModelEngine.success(transcript.text);
    } catch (error) {
      return ModelEngine.err(error);
    }
  }

  async groqTranscribe(audioFile: string, apiKey: string): Promise<IChatServiceResponse> {
    try {
      const groq = new Groq({ apiKey });
      const transcript = await groq.audio.transcriptions.create({
        file: fs.createReadStream(audioFile),
        model: 'whisper-large-v3',
        response_format: 'verbose_json',
      });
      return ModelEngine.success(transcript.text);
    } catch (error) {
      return ModelEngine.err(error);
    }
  }


  valid(llm: IAIConfig | undefined): boolean {
      return llm !== undefined && llm.apiKey !== undefined && llm.apiKey.length > 0;
  }

  interactionRequest(systemMessage: string, humanMessage: string): Promise<IChatServiceResponse> {
    const messageStack: IGenericMessage[] = [
      { role: 'system', content: systemMessage },
      { role: 'user', content: humanMessage },
    ];
    return this.llmRequest(messageStack);
}

  async llmRequest(messageStack: IGenericMessage[], llm?: IAIConfig, model?: string ): Promise<IChatServiceResponse> {

    this.log$.next(
      {
        level: 'info',
        message: `llmRequest: LLM=${llm?.provider} MODEL=${model} STACKSIZE=${messageStack.length}`,
      });

    try {
      const settings = this.getSettings()
      const provider = settings.defaultChatProvider;

      let llmToUse = llm || settings.AIConfigs.find((llm) => llm.provider === provider);

      if (!this.valid(llmToUse)) {
        llmToUse = settings.AIConfigs.find((llm) => llm.chatModels.length > 0 && this.valid(llm) )
      }
      if (this.valid(llmToUse)) {
          const modelToUse = this.getModel(llmToUse!, model);
          this.log$.next(
            {
              level: 'important',
              message: `LLM request to ${llmToUse?.provider} against model ${modelToUse}. Sending MessageStack size ${messageStack.length}`,
            });
          if (llmToUse!.provider == Utilities.ANTHROPIC) {
            if (modelToUse !== undefined) {
              const response = await this.anthropicRequest(messageStack, llm!, modelToUse);
              return response;
            }

          } else if (llm!.provider === Utilities.OPENAI || llm!.openAiBaseURL !== undefined) {

            if (modelToUse !== undefined) {
              const response = this.openAiRequest(messageStack, llm!, modelToUse);
              return response;
            }
          }
      }
    } catch (error) {
      this.error$.next(`${error}`);
      return new Promise((resolve) => ModelEngine.err(error));
    }

    const message = 'Unable to service.  No LLM configured to perform LLM completion requests exists with an API key';
    this.error$.next(message);
    return new Promise((resolve) => ModelEngine.err(new Error(message)));
  }

  async anthropicRequest(messageStack: IGenericMessage[], llm: IAIConfig, model: string): Promise<IChatServiceResponse> {
    const systemMessage = messageStack.find((x) => x.role === 'system');
    const anthropic = new Anthropic({
      apiKey: llm.apiKey,
      dangerouslyAllowBrowser: true,
    });
    const message = await anthropic.messages.create({
      model: model,
      max_tokens: 1024,
      system: systemMessage ? systemMessage.content : undefined,
      messages: messageStack.filter((x) => x.role !== 'system') as IGenericAnthroMessage[],
    });
    this.log$.next({
      level: 'trace',
      message: JSON.stringify(message.content, null, 2),
    });
    if (message.content.length > 0 && message.content[0].type === 'text') {
      return ModelEngine.success((message.content[0] as any).text);
    } else {
      this.error$.next('Unable to get text reply from Anthropic model response.');
      this.error$.next(JSON.stringify(message.content, null, 2));
      return ModelEngine.err('Unable to get text reply from Anthropic model response.');
    }
  }

  async openAiRequest(messageStack: IGenericMessage[], llm: IAIConfig, model: string): Promise<IChatServiceResponse> {
      const instance = llm.openAiBaseURL ?
        new OpenAI({ baseURL: llm.openAiBaseURL, apiKey:  llm.apiKey, dangerouslyAllowBrowser: true }) :
        new OpenAI({ apiKey:  llm.apiKey, dangerouslyAllowBrowser: true });

      const reply = await  instance.chat.completions
        .create( {
          messages: messageStack,
          model: model,
        })
      this.log$.next({
        level: 'trace',
        message: JSON.stringify(reply.choices, null, 2),
      });
      return ModelEngine.success(reply.choices[0].message.content!);
  }

  private getModel(llm: IAIConfig, proposed: string | undefined): string | undefined {
    if (proposed) {
      return llm.chatModels.find(x => x === proposed) ? proposed : undefined;
    }

    return llm.chatModels.find(x => x === llm.preferredChatModel)
      ? llm.preferredChatModel :
        llm.chatModels.length > 0
          ? llm.chatModels[0] :
            undefined;
  }

  private static success(text: string): IChatServiceResponse {
    return { status: 'SUCCESS', text };
  }

  private static err(errObj: any): IChatServiceResponse {
    return { status: 'FAILURE', text: '', error: errObj };
  }

}
