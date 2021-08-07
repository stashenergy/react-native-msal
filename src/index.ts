import { PublicClientApplication } from './publicClientApplication';
import { IPublicClientApplication, MSALConfiguration } from './types';

export * from './types';

let instance: IPublicClientApplication;
export async function createPublicClientApplication(config: MSALConfiguration): Promise<IPublicClientApplication> {
  if (!instance) {
    instance = await new PublicClientApplication(config).init();
  }
  return instance;
}
