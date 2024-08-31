export default class Shared {
  static formattedNow(): string {
    const now = new Date();

    const padStart = (value: number) => value.toString().padStart(2, '0');

    return (
      `${now.getFullYear()}${padStart(now.getMonth())}${padStart(now.getDate())}_` +
      `${padStart(now.getHours())}${padStart(now.getMinutes())}${padStart(now.getSeconds())}_` +
      `${now.getMilliseconds()}`
    );
  }

  static readonly keys = {
    STORE: 'anthropic.playground',
    BASE_URL: 'baseUrl', //  'https://api.deepinfra.com/v1/openai',
    API_KEY: 'apiKey', // '',
    MODEL: 'model', // 'meta-llama/Meta-Llama-3.1-70B-Instruct',
    SYSTEM_MESSAGE: 'SystemMessage',
    MODEL_LIST: 'ModelList',
  };
}
