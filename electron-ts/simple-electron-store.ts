import { app } from 'electron';
import * as fs from 'fs';
import { IFileInfo } from './file-info';
import { Utilities } from './utility-classes';


class SimpleElectronStore {
  userDataPath: string;

  sessionFilePath: string;

  files: IFileInfo[] = [];

  constructor() {
    this.userDataPath = app.getPath('userData'); // or path.resolve('.');
    this.sessionFilePath = `${this.userDataPath}/${Utilities.formattedNow()}.txt`;
  }

  public getFileInfo(store: string): { path: string; info: IFileInfo } {
    const path = this.getPath(store);
    const info = this.lazyLoad(store);

    return {
      path,
      info,
    };
  }

  getUserDataPath(): string {
    return this.userDataPath;
  }

  keys(store: string): string[] {
    const fi = this.lazyLoad(store);
    return Object.keys(fi.data);
  }

  get<T>(store: string, key: string): T {
    const fi = this.lazyLoad(store);
    fi.statusList.push('get');
    fi.statusList.push(key);
    return fi.data[key] as T;
  }

  set(store: string, key: string, value: any): void {
    const fi = this.lazyLoad(store);
    fi.data[key] = value;
    fi.statusList.push('set');
    fi.statusList.push(key);
    SimpleElectronStore.save(fi);

    this.sessionLog([
      `[store=${store}][key=${key}]`,
      `[value=${JSON.stringify(value)}]`,
    ]);
  }

  sessionLog(messages: string[]) {
    try {
      messages.forEach((msg) => fs.appendFileSync(this.sessionFilePath, `${msg}\n`));
    } catch (error) {
      // If file read or parse fails, start with an empty object
      console.warn('Could not append to session log file ', error);
    }
  }

  delete(store: string, key: string): void {
    const fi = this.lazyLoad(store);
    delete fi.data[key];
    fi.statusList.push('delete');
    fi.statusList.push(key);
    SimpleElectronStore.save(fi);
  }

  // Save the current state to disk
  private static save(fi: IFileInfo): void {
    fs.writeFileSync(fi.filePath, JSON.stringify(fi.data, null, 2));
    fi.statusList.push('Saved');
  }

  private getPath(store: string): string {
    return `${this.userDataPath}/${store}.json`;
  }

  private lazyLoad(store: string): IFileInfo {
    let matchingFi = this.files.find((fi) => fi.name === store);
    let status = 'new';
    if (matchingFi === undefined) {
      let data: Record<string, any> = {};
      const path = this.getPath(store);
      try {
        // Try to read the file and parse it as JSON
        data = JSON.parse(fs.readFileSync(path, 'utf-8'));
        status = 'open';
      } catch (error) {
        // If file read or parse fails, start with an empty object
        data = {};
      }
      matchingFi = {
        name: store,
        filePath: path,
        existsOnDisk: status !== 'new',
        data: data as Record<string, any>,
        statusList: [status],
      };
    }

    return matchingFi;
  }
}

export default SimpleElectronStore;
