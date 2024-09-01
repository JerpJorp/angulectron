export class Utilities {
  static RequiredFiles(): {
    name: string;
    devPath: string;
    prodPath: string;
  }[] {
    return [
      {
        name: 'ffmpeg',
        devPath: 'public\\bin\\ffmpeg.exe',
        prodPath: 'resources\\app\\bin\\ffmpeg.exe',
      },
    ];
  }

  static STORE_CONFIG = 'LectureModel.Store';

  static ASSEMBLYAI = 'AssemblyAI';
  static DefaultSettings(): ISettings {
    return {
      defaultChatProvider: 'OpenAI',
      defaultLiveTranscriptionProvider: this.ASSEMBLYAI,
      defaultTranscribeProvider: 'Groq',
      interactions: [
        {
          name: 'Summary',
          prompt:
            'Create a detailed, organized record of the following audio transcript of a lecture.  ' +
            'Format your reply with markdown syntax.'
        },
        {
          name: 'Study Guide',
          prompt:
            'Create a comprehensive study guide based on the material provided in this transcript of a ' +
            'class lecture and areas I should research for further study to better understand the topics covered.  ' +
            'Format your reply with markdown syntax'
        },
      ],
      AIConfigs: [
        {
          provider: 'OpenAI',
          apiKey: '',
          chatModels: [
            'gpt-4o',
            'gpt-4o-mini',
            'gpt-4-turbo',
            'gpt-4',
          ],
          preferredChatModel: 'gpt-4o',
          transcribe: true,
          liveTranscribe: false,
        },
        {
          provider: 'Anthropic',
          apiKey: '',
          chatModels: [
            'claude-3-5-sonnet-20240620',
            'claude-3-haiku-20240307',
            'claude-3-opus-20240229',
            'gpt-4',
          ],
          preferredChatModel: 'claude-3-5-sonnet-20240620',
          transcribe: false,
          liveTranscribe: false,
        },
        {
          provider: 'AssmblyAI',
          apiKey: '',
          chatModels: [],
          preferredChatModel: '',
          transcribe: false,
          liveTranscribe: true,
        },
        {
          provider: 'DeepInfra',
          apiKey: '',
          chatModels: [
            'meta-llama/Meta-Llama-3.1-405B-Instruct',
            'meta-llama/Meta-Llama-3.1-70B-Instruct',
          ],
          opnAiBaseURL: 'https://api.deepinfra.com/v1/openai',
          preferredChatModel: 'meta-llama/Meta-Llama-3.1-405B-Instruct',
          transcribe: false,
          liveTranscribe: false,
        },
        {
          provider: 'Groq',
          apiKey: '',
          chatModels: [],
          preferredChatModel: '',
          transcribe: true,
          liveTranscribe: false,
        },
      ]
    }
  }

}

export interface ISettings {
  AIConfigs: IAIConfig[];
  defaultChatProvider: string;
  defaultTranscribeProvider: string;
  defaultLiveTranscriptionProvider: string;
  interactions: { name: string; prompt: string }[];
}

export interface IAIConfig {
  provider: string;
  apiKey: string;
  opnAiBaseURL?: string;
  chatModels: string[];
  preferredChatModel: string;
  liveTranscribe: boolean;
  transcribe: boolean;
}
