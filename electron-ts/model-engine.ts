import { BrowserWindow, ipcMain, utilityProcess } from "electron";
import * as fs from 'fs';

import axios, {AxiosRequestConfig, RawAxiosRequestHeaders} from 'axios';
import { Subject } from "rxjs";
import OpenAI from 'openai';
import Groq from 'groq-sdk';
import Anthropic from '@anthropic-ai/sdk';
import { GoogleAIFileManager, FileState } from "@google/generative-ai/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

import { IAIConfig, ISettings, Utilities } from "./utility-classes";


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

  pendingRequests: {id: string, message: string}[] = [];


  constructor(
    public mainWindow: BrowserWindow,
    public getSettings: () => ISettings) {

    ipcMain.handle('transcribe', async (undefined, audioFilePath: string): Promise<IChatServiceResponse> => this.transcribe(audioFilePath));
    ipcMain.handle(
      'interaction-request',
      async (undefined, systemMessage: string, humanMessage: string): Promise<IChatServiceResponse> =>
         this.interactionRequest(systemMessage, humanMessage));
    ipcMain.handle(
      'llm-request',
      async (undefined, messageStack: IGenericMessage[], llm?: IAIConfig, model?: string): Promise<IChatServiceResponse> =>
          this.llmRequest(messageStack, llm, model));
    // ipcMain.handle(
    //   'models',
    //   async (undefined, llm?: IAIConfig): Promise<{models: string[]; error?: any}> =>
    //       this.models(llm));
  }

  addPendingRequest(id: string, message: string) {
    this.pendingRequests.push({ id, message });
    this.sendPending();
  }

  removePendingRequest(id: string) {
    this.pendingRequests = this.pendingRequests.filter(x => x.id !== id);
    this.sendPending();
  }

  sendPending() {
    this.mainWindow.webContents.send('pending-requests', this.pendingRequests.map(x => x.message));
  }

  async transcribe(audioFilePath: string): Promise<IChatServiceResponse> {
    const id = Utilities.formattedNow();
    this.addPendingRequest(id, 'Transcribe Request');
    try {
      const settings = this.getSettings()
      const provider = settings.defaultTranscribeProvider;
      let llm = settings.AIConfigs.find((llm) => llm.provider === provider);

      if (!this.valid(llm)) {
          llm = settings.AIConfigs.find((llm) => llm.transcribe && this.valid(llm) )
      }
      if (this.valid(llm)) {
        const reply = llm!.provider == Utilities.OPENAI ?
          await this.openAiTranscribe(audioFilePath, llm!.apiKey) :
          llm!.provider == Utilities.GEMINI ?
            await this.geminiTranscribe(audioFilePath, llm!) :
            await this.groqTranscribe(audioFilePath, llm!.apiKey);
        return reply;
      } else {
        return ModelEngine.err('Cannot transcribe: invalid transcription AI provider');
      }
    } catch (error) {
      this.error$.next(`${error}`);
      return ModelEngine.err(error);
    } finally {
      this.removePendingRequest(id);
    }
  }

  async geminiTranscribe(audioFile: string, aiConfig: IAIConfig): Promise<IChatServiceResponse> {
    try {
      const fileManager = new GoogleAIFileManager(aiConfig.apiKey);

      this.log$.next(
        {
          level: 'important',
          message: `google file upload: LLM=${audioFile}`,
        });

      const uploadResult = await fileManager.uploadFile(
        audioFile,
        {
          mimeType: "audio/mp3",
          displayName: "Audio sample",
        },
      );

      let file = await fileManager.getFile(uploadResult.file.name);
      while (file.state === FileState.PROCESSING) {
        this.log$.next(
          {
            level: 'info',
            message: `google file upload: pending `,
          });

        // Sleep for 10 seconds
        await new Promise((resolve) => setTimeout(resolve, 4000));
        // Fetch the file from the API again
        file = await fileManager.getFile(uploadResult.file.name);
      }

      this.log$.next(
        {
          level: 'info',
          message: `google file upload finished: status = ${file.state}`,
        });

      if (file.state === FileState.FAILED) {
        throw new Error("Audio processing failed.");
      }

      this.log$.next(
        {
          level: 'info',
          message: `Uploaded file ${uploadResult.file.displayName} as: ${uploadResult.file.uri}`,
        });

      const genAI = new GoogleGenerativeAI(aiConfig.apiKey);
      const modelName = aiConfig.transcribeProvider && aiConfig.transcribeProvider.length > 0 ?
        aiConfig.transcribeProvider :
        aiConfig.preferredChatModel;

      const model = genAI.getGenerativeModel({ model: modelName });

      this.log$.next(
        {
          level: 'info',
          message: `google file transcribe request to model ${modelName}`,
        });

      const result = await model.generateContent([
        "transcribe this audio file recording.",
        {
          fileData: {
            fileUri: uploadResult.file.uri,
            mimeType: uploadResult.file.mimeType,
          },
        },
      ]);

      return ModelEngine.success(result.response.text());
    } catch (error) {
      return ModelEngine.err(error);
    }
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

  // async models(maybeLlm?: IAIConfig) : Promise<{ models: string[]; error?: any; }> {

  //     const settings = this.getSettings()
  //     const provider = settings.defaultChatProvider;

  //     const llmtoUse = maybeLlm || settings.AIConfigs.find((llm) => llm.provider === provider);
  //     const llm = llmtoUse!;
  //     this.log$.next(
  //       {
  //         level: 'important',
  //         message: `models request: LLM=${llm?.provider}`,
  //       });

  //       let reply: any = {};
  //       if (llm.provider == Utilities.ANTHROPIC) {
  //         const anthropic = new Anthropic({
  //           apiKey: llm.apiKey,
  //           dangerouslyAllowBrowser: true,c
  //         });
  //         reply = await anthropic.get('models');

  //       } else if (llm.provider == Utilities.PERPLEXITY) {
  //         const instance = new OpenAI({ baseURL: 'https://api.perplexity.ai/chat', apiKey:  llm.apiKey, dangerouslyAllowBrowser: true });
  //         reply = await instance.models.list();
  //       } else if (llm.provider == Utilities.GEMINI) {
  //         const instance = new OpenAI({ baseURL: 'https://api.perplexity.ai/chat', apiKey:  llm.apiKey, dangerouslyAllowBrowser: true });
  //         reply = await instance.models.list();
  //       } else {
  //         const instance = llm.openAiBaseURL ?
  //           new OpenAI({ baseURL: llm.openAiBaseURL, apiKey:  llm.apiKey, dangerouslyAllowBrowser: true }) :
  //           new OpenAI({ apiKey:  llm.apiKey, dangerouslyAllowBrowser: true });
  //         reply = await instance.models.list();
  //       }



  //     this.log$.next(
  //       {
  //         level: 'important',
  //         message: `models reply: ${JSON.stringify(reply.data)}`,
  //       });

  //     return {
  //       models: [],
  //       error: undefined,
  //     }
  // }

  async llmRequest(messageStack: IGenericMessage[], maybeLlm?: IAIConfig, model?: string ): Promise<IChatServiceResponse> {

    this.log$.next(
      {
        level: 'important',
        message: `llmRequest: LLM=${maybeLlm?.provider} MODEL=${model} STACKSIZE=${messageStack.length}`,
      });

    try {
      const settings = this.getSettings()
      const provider = settings.defaultChatProvider;

      let llmToUse = maybeLlm || settings.AIConfigs.find((llm) => llm.provider === provider);

      if (!this.valid(llmToUse)) {
        this.log$.next( {level: 'important', message: 'either specified llm or default llm provider isn not valid - looking for any model' });
        llmToUse = settings.AIConfigs.find((llm) => llm.chatModels.length > 0 && this.valid(llm) )
      }
      if (this.valid(llmToUse)) {
        this.log$.next( {level: 'info', message: 'calling getModel on valid LLM' });
          const modelToUse = this.getModel(llmToUse!, model);
          this.log$.next(
            {
              level: 'important',
              message: `LLM request to ${llmToUse?.provider} against model ${modelToUse}. Sending MessageStack size ${messageStack.length}`,
            });
          if (llmToUse!.provider == Utilities.ANTHROPIC) {
            if (modelToUse !== undefined) {
              const response = await this.anthropicRequest(messageStack, llmToUse!, modelToUse);
              return response;
            }

          } else if (llmToUse!.provider == Utilities.PERPLEXITY) {
            if (modelToUse !== undefined) {
              const response = await this.perplexityRequest(messageStack, llmToUse!, modelToUse);
              return response;
            }
          } else if (llmToUse!.provider === Utilities.GEMINI) {
            if (modelToUse !== undefined) {
              const response = await this.geminiRequest(messageStack, llmToUse!, modelToUse);
              return response;
            }
          }
          else if (llmToUse!.provider === Utilities.OPENAI || llmToUse!.openAiBaseURL !== undefined) {

            if (modelToUse !== undefined) {
              const response = this.openAiRequest(messageStack, llmToUse!, modelToUse);
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

    const id = Utilities.formattedNow();
    this.addPendingRequest(id, `${llm.provider} request`);
    try {
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
        level: 'info',
        message: 'anthropic response received'
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
    } catch(error) {
      return ModelEngine.err(error);
    } finally {
      this.removePendingRequest(id);
    }
  }

  async perplexityRequest(messageStack: IGenericMessage[], llm: IAIConfig, model: string): Promise<IChatServiceResponse> {

    const id = Utilities.formattedNow();
    this.addPendingRequest(id, `${llm.provider} request`);
    try {
      const client = axios.create({
        baseURL: 'https://api.perplexity.ai/chat',
      });

      axios.interceptors.request.use((config) => {
        // Do something before request is sent
        return config;
      }, (error) => {
        this.error$.next(`axios interceptor request error: ${error}`);
        return Promise.reject(error);
      });

      client.interceptors.response.use( (response) => {
        return response;
      }, (error) => {
        this.error$.next(`axios interceptor response error: ${error}`);
        return Promise.reject(error);
      })
      const body = {
        model: model, //"llama-3.1-sonar-small-128k-online",
        messages: messageStack,
        return_images:false,
        return_related_questions: false,
        search_recency_filter: "month",
      }

      const config: AxiosRequestConfig = {
        headers: {
          'Authorization': `Bearer ${llm.apiKey}`,
          'Content-Type': 'application/json'
        } as RawAxiosRequestHeaders,
      };

      this.log$.next({
        level: 'info',
        message: `perplexity POST sending ${JSON.stringify(config)}`
      });

      const docResponse = await client.post(`/completions`, body, config);
      const reply = docResponse.data;
      this.log$.next({
        level: 'info',
        message: 'llm response received'
      });
      this.log$.next({
        level: 'trace',
        message: JSON.stringify(reply.choices, null, 2),
      });

      return ModelEngine.success(reply.choices[0].message.content!);
    } catch(error) {
      return ModelEngine.err(error);
    } finally {
      this.removePendingRequest(id);
    }

  }

  async openAiRequest(messageStack: IGenericMessage[], llm: IAIConfig, model: string): Promise<IChatServiceResponse> {
      const instance = llm.openAiBaseURL ?
        new OpenAI({ baseURL: llm.openAiBaseURL, apiKey:  llm.apiKey, dangerouslyAllowBrowser: true }) :
        new OpenAI({ apiKey:  llm.apiKey, dangerouslyAllowBrowser: true });

      const id = Utilities.formattedNow();
      this.addPendingRequest(id, `${llm.provider} request`);
      try {
        const reply = await  instance.chat.completions
        .create( {
          messages: messageStack,
          model: model,
          max_tokens: llm.maxTokens || undefined,
        })
      this.log$.next({
        level: 'info',
        message: `llm response received with maxtokens ${llm.maxTokens}`
      });
      this.log$.next({
        level: 'trace',
        message: JSON.stringify(reply.choices, null, 2),
      });
      return ModelEngine.success(reply.choices[0].message.content!);
      } catch(error) {
        return ModelEngine.err(error);
      } finally {
        this.removePendingRequest(id);
      }
  }

  async geminiRequest(messageStack: IGenericMessage[], llm: IAIConfig, modelName: string): Promise<IChatServiceResponse> {

      const systemMessage = messageStack.find((x) => x.role === 'system');
      const messageStackFiltered = messageStack.filter((x) => x.role !== 'system');
      const last = messageStackFiltered.length -1;
      if (messageStackFiltered[last].role === 'user') {
        const id = Utilities.formattedNow();
        this.addPendingRequest(id, `${llm.provider} request`);
        try {
          const userMessage = messageStackFiltered.pop();
          const genAI = new GoogleGenerativeAI(llm.apiKey);
          const model = genAI.getGenerativeModel({ model: modelName, systemInstruction: systemMessage ? systemMessage.content : undefined});

          const chat = model.startChat({
            history: messageStackFiltered.map((X) =>
              ({ role: X.role == 'assistant' ? 'model' : 'user', parts: [{ text: X.content }] }))
          });
          let result = await chat.sendMessage(userMessage!.content);
          const reply = result.response.text();
          this.log$.next({
            level: 'info',
            message: `gemini llm response received`
          });
          this.log$.next({
            level: 'trace',
            message: JSON.stringify(reply, null, 2),
          });
          return ModelEngine.success(reply);
        } catch(error) {
          return ModelEngine.err(error);
        } finally {
          this.removePendingRequest(id);
        }
      } else {
        return ModelEngine.err('no user message to send to gemini LLM provider as last message in the stack. Yell at Kelley.');
      }
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
