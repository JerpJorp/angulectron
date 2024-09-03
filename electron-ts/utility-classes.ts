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

  static formattedNow(): string {
    const now = new Date();

    const padStart = (value: number) => value.toString().padStart(2, '0');

    return (
      `${now.getFullYear()}${padStart(now.getMonth())}${padStart(now.getDate())}_` +
      `${padStart(now.getHours())}${padStart(now.getMinutes())}${padStart(now.getSeconds())}_` +
      `${now.getMilliseconds()}`
    );
  }

  static STORE_CONFIG = 'LectureModel.Store';
  static INSTANCE_CONFIG = 'LectureModel.Instances';

  static GROQ = 'Groq';
  static ASSEMBLYAI = 'AssemblyAI';
  static ANTHROPIC = 'Anthropic';
  static OPENAI = 'OpenAI'
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
          provider: this.OPENAI,
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
          provider: this.ANTHROPIC,
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
          provider: this.ASSEMBLYAI,
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
          openAiBaseURL: 'https://api.deepinfra.com/v1/openai',
          preferredChatModel: 'meta-llama/Meta-Llama-3.1-405B-Instruct',
          maxTokens: 100000,
          transcribe: false,
          liveTranscribe: false,
        },
        {
          provider: this.GROQ,
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
  maxTokens?: number;
  openAiBaseURL?: string;
  chatModels: string[];
  preferredChatModel: string;
  liveTranscribe: boolean;
  transcribe: boolean;
}
