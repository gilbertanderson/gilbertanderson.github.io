// jsdom, but keeping Node's AbortController/AbortSignal.
// jsdom replaces them with its own, and Node's fetch (undici) then rejects the
// signal RTK Query passes to `new Request(...)` ("Expected signal to be an
// instance of AbortSignal"), so no request is ever sent.
import type { Environment } from 'vitest/environments';
import { builtinEnvironments } from 'vitest/environments';

const env: Environment = {
  name: 'jsdom-node-abort',
  transformMode: 'web',
  async setup(global, options) {
    const { AbortController, AbortSignal } = global;
    const jsdom = await builtinEnvironments.jsdom.setup(global, options);
    global.AbortController = AbortController;
    global.AbortSignal = AbortSignal;
    return jsdom;
  },
};

export default env;
