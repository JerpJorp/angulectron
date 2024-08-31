export interface IFileInfo {
  name: string;
  filePath: string;
  statusList: string[];
  existsOnDisk: boolean;
  data: Record<string, any>;
}
