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
  /** Words in the headline shown in the accent color. */
  headline_highlights?: string[];
  bio?: string;
  url: string;
  accent?: string;
  accent_on_dark?: string;
  /** Profile banner, path under frontend/public. */
  banner?: string | null;
  /** Profile photo, path under frontend/public. */
  avatar?: string | null;
  /** Path under frontend/public, e.g. /Resume.docx. */
  resume?: string | null;
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
  /** Repository or live link; leave out for unreleased work. */
  url?: string | null;
  category?: "design" | "development";
  link_label?: string;
  /** Optional playable or live version. */
  demo_url?: string | null;
  /** Optional write-up, e.g. a blog post about the project. */
  article_url?: string | null;
  /** Path under frontend/public, e.g. /projects/dive-log.png. */
  image?: string | null;
};
export type Position = {
  title: string;
  period: string;
  /** Optional line under the title, e.g. the program or employer. */
  note?: string | null;
  highlights: string[];
};
export type Role = {
  company: string;
  /** Company logo, path under frontend/public. */
  logo?: string | null;
  /** Display text, e.g. 'Jul 2023 – Jul 2025'. */
  period: string;
  title?: string | null;
  highlights?: string[];
  /** Several titles at one company, newest first. */
  positions?: Position[];
};
export type ToolGroup = {
  group: string;
  items: string[];
};
export type Article = {
  title: string;
  summary?: string;
  url: string;
  /** Where it was published, e.g. 'Medium'. */
  source?: string;
};
export type HowBuilt = {
  heading: string;
  blurb?: string;
  points: string[];
};
export type ContactSection = {
  heading: string;
  blurb?: string;
  email?: string | null;
  /** Display text, e.g. '504-233-3599'. */
  phone?: string | null;
};
export type SiteContent = {
  site: Site;
  links: Link[];
  projects: Project[];
  experience?: Role[];
  tools: ToolGroup[];
  credentials?: ToolGroup[];
  writing?: Article[];
  how_built?: HowBuilt | null;
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
