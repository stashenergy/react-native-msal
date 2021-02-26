import type { MSALConfiguration } from '../types';
import PublicClientApplication from '../publicClientApplication';
jest.mock('../publicClientApplication');

const testMsalConfig: MSALConfiguration = {
  auth: {
    clientId: '1234',
  },
};

describe('PublicClientApplication', () => {
  const MockedPCA = PublicClientApplication as jest.MockedClass<typeof PublicClientApplication>;

  beforeEach(() => {
    MockedPCA.mockClear();
  });

  it('mock works', () => {
    const pca = new MockedPCA(testMsalConfig);
    expect(MockedPCA).toHaveBeenCalledTimes(1);
    expect(pca).not.toBeNull();
  });

  it('mockClear works', () => {
    expect(MockedPCA).not.toHaveBeenCalled();

    const pca = new MockedPCA(testMsalConfig);
    expect(MockedPCA).toHaveBeenCalledTimes(1);
    expect(pca).not.toBeNull();
  });

  it('Can call native function without error', async () => {
    const pca = new MockedPCA(testMsalConfig);
    await pca.getAccounts();
    expect(pca.getAccounts).toHaveBeenCalledTimes(1);
  });
});
