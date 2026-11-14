// Generates typed RTK Query endpoints and hooks from the FastAPI schema.
// openapi.json is written by `npm run export` (backend/scripts/export.py).
/** @type {import('@rtk-query/codegen-openapi').ConfigFile} */
module.exports = {
  schemaFile: './openapi.json',
  apiFile: './src/store/emptyApi.ts',
  apiImport: 'emptySplitApi',
  outputFile: './src/client/siteApi.ts',
  exportName: 'siteApi',
  hooks: true,
};
