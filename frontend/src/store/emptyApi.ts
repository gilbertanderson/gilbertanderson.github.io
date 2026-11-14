import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { API_URL } from '../config';

// Endpoints are injected by the generated src/client/siteApi.ts.
export const emptySplitApi = createApi({
  reducerPath: 'siteApi',
  baseQuery: fetchBaseQuery({ baseUrl: API_URL }),
  endpoints: () => ({}),
});
