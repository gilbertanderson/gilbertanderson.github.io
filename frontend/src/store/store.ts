import { configureStore } from '@reduxjs/toolkit';
import { siteApi } from '../client/siteApi';

export function makeStore() {
  return configureStore({
    reducer: { [siteApi.reducerPath]: siteApi.reducer },
    middleware: (getDefault) => getDefault().concat(siteApi.middleware),
  });
}

export type AppStore = ReturnType<typeof makeStore>;
