import { createClient } from '@base44/sdk';
import { appParams } from '@/lib/app-params';

const { appId, token, functionsVersion, appBaseUrl } = appParams;

// Validate required configuration at startup
if (!appId) {
  console.error(
    '[ChoreBuddy] Missing VITE_BASE44_APP_ID. ' +
    'Set it in your .env.local file. See README.md for setup instructions.'
  );
}
if (!appBaseUrl) {
  console.error(
    '[ChoreBuddy] Missing VITE_BASE44_APP_BASE_URL. ' +
    'Set it in your .env.local file. See README.md for setup instructions.'
  );
}

//Create a client with authentication required
export const base44 = createClient({
  appId,
  token,
  functionsVersion,
  serverUrl: '',
  requiresAuth: true,
  appBaseUrl
});
