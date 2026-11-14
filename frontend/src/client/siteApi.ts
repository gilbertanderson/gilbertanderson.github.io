import { emptySplitApi as api } from "../store/emptyApi";
const injectedRtkApi = api.injectEndpoints({
  endpoints: (build) => ({
    getContent: build.query<GetContentApiResponse, GetContentApiArg>({
      query: () => ({ url: `/api/content` }),
    }),
    sendContact: build.mutation<SendContactApiResponse, SendContactApiArg>({
      query: (queryArg) => ({
        url: `/api/contact`,
        method: "POST",
        body: queryArg.contactMessage,
      }),
    }),
    health: build.query<HealthApiResponse, HealthApiArg>({
      query: () => ({ url: `/api/health` }),
    }),
  }),
  overrideExisting: false,
});
export { injectedRtkApi as siteApi };
export type GetContentApiResponse =
  /** status 200 Successful Response */ SiteContent;
export type GetContentApiArg = void;
export type SendContactApiResponse =
  /** status 200 Successful Response */ ContactReceipt;
export type SendContactApiArg = {
  contactMessage: ContactMessage;
};
export type HealthApiResponse = /** status 200 Successful Response */ {
  [key: string]: string;
};
export type HealthApiArg = void;
export type Site = {
  name: string;
  /** Short role line shown above the headline. */
  title: string;
  headline: string;
  bio?: string;
  url: string;
  accent?: string;
  accent_on_dark?: string;
};
export type Link = {
  label: string;
  url: string;
};
export type Project = {
  title: string;
  /** Short category tag, e.g. 'React'. */
  kind: string;
  description: string;
  url: string;
  link_label?: string;
  /** Path under frontend/public, e.g. /projects/dive-log.png. */
  image?: string | null;
};
export type ToolGroup = {
  group: string;
  items: string[];
};
export type ContactSection = {
  heading: string;
  blurb?: string;
};
export type SiteContent = {
  site: Site;
  links: Link[];
  projects: Project[];
  tools: ToolGroup[];
  contact: ContactSection;
};
export type ContactReceipt = {
  ok: boolean;
  detail: string;
};
export type ValidationError = {
  loc: (string | number)[];
  msg: string;
  type: string;
};
export type HttpValidationError = {
  detail?: ValidationError[];
};
export type ContactMessage = {
  name: string;
  email: string;
  message: string;
};
export const { useGetContentQuery, useSendContactMutation, useHealthQuery } =
  injectedRtkApi;
