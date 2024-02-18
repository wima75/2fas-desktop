export interface IElectronAPI {
  onLoadData: (data: any) => Promise<void>,
  requestData: () => Promise<void>,
  requestImport: () => Promise<void>,
  copyToken: (token: string) => Promise<void>
}

declare global {
  interface Window {
    electronAPI: IElectronAPI
  }
}