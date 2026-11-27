/*
  Site settings for Nutrition Scanner. Nothing secret goes in this file;
  it is public like the rest of the site.

  USDA_PROXY_URL
    Leave empty to use Open Food Facts only.
    To fill gaps with USDA FoodData Central, deploy one of the proxies in
    the repo's nutrition-scanner/proxy/ folder (it holds your api.data.gov key), put its URL here,
    and add the same origin to connect-src in index.html's
    Content-Security-Policy. See nutrition-scanner/proxy/README.md.
*/
const CONFIG = {
  USDA_PROXY_URL: ""
};
