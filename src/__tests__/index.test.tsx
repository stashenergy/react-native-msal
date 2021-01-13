import type { MSALConfiguration } from '../types';
import _PublicClientApplication from '../publicClientApplication';
jest.mock('../publicClientApplication');

const PublicClientApplication = _PublicClientApplication as jest.Mock<_PublicClientApplication>;

const testMsalConfig: MSALConfiguration = {
  auth: {
    clientId: '1234',
  },
};

beforeEach(() => {
  PublicClientApplication.mockClear();
});

it('mock works', () => {
  const pca = new PublicClientApplication(testMsalConfig);
  expect(PublicClientApplication).toHaveBeenCalledTimes(1);
  expect(pca).not.toBeNull();
});

it('mockClear works', async () => {
  expect(PublicClientApplication).not.toHaveBeenCalled();

  const pca = new PublicClientApplication(testMsalConfig);
  expect(PublicClientApplication).toHaveBeenCalledTimes(1);
  expect(pca).not.toBeNull();
});
