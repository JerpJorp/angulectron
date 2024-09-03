import { Utilities } from "../../../electron-ts/utility-classes";

export class TranscriptInstance {
  
  id = Utilities.formattedNow();
  transcript = '' ;
  note = '';
  file?: string;
  date = new Date().toLocaleString();
  name = '';
  interactions: {name: string; value: string}[] = [];
  history: { message: string; value: string}[] = [];

  static Factory(props?: {
    transcript?: string,
    file?: string,
    date?: string,
    name?: string,
    note?: string
  }): TranscriptInstance {

    return {
      id: Utilities.formattedNow(),
      name: props?.name || '',
      note: props?.note || '',
      transcript: props?.transcript || '',
      file: props?.file || undefined,
      date: props?.date || new Date().toLocaleString(),
      interactions: [],
      history: []
    };
  }
}
