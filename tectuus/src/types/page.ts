// Shape of the CMS's public page endpoint (`/pages/{slug}`). Every page in
// `src/pages` fetches this and hands `sections` to <SectionRenderer />, so the
// order and set of sections is decided in the CMS, not here.
export type PageSection = {
  type: string;
  content: Record<string, any>;
};

export type Page = {
  slug: string;
  path: string;
  title: string;
  sections: PageSection[];
};

export type PageResponse = {
  status: string;
  data: Page;
  meta: Record<string, any>;
};
