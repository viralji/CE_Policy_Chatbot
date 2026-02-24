/**
 * Microsoft Azure AD (MSAL) config for org-only sign-in.
 * Same tenant/app as CE_DF_Photos.
 * Set REACT_APP_AZURE_CLIENT_ID and REACT_APP_AZURE_TENANT_ID in frontend .env (only REACT_APP_* is exposed in CRA).
 */
const tenantId = process.env.REACT_APP_AZURE_TENANT_ID || '28ca66c4-1213-4649-b4e6-599b5f207a74';
const clientId = process.env.REACT_APP_AZURE_CLIENT_ID || 'b890730b-c056-492b-a83a-d31b0da7bd7b';

export const msalConfig = {
  auth: {
    clientId,
    authority: `https://login.microsoftonline.com/${tenantId}`,
    redirectUri: typeof window !== 'undefined' ? window.location.origin : '/',
    postLogoutRedirectUri: typeof window !== 'undefined' ? window.location.origin : '/',
  },
  cache: {
    cacheLocation: 'sessionStorage',
    storeAuthStateInCookie: false,
  },
};

export const loginRequest = {
  scopes: ['openid', 'profile'],
};
