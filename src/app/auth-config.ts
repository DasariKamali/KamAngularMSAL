export const msalConfig = {
    auth: {
      clientId: '<client_ID>',
      authority: 'https://login.microsoftonline.com/<Tenant_ID>',
      redirectUri: 'http://localhost:4200',
    },
    cache: {
      cacheLocation: 'localStorage',
      storeAuthStateInCookie: true,
    },
  };
  