export type MenuItem = {
  slug: string;
  path: string;
  title: string;
  children: MenuItem[];
};

export type MenuResponse = {
  status: string;
  data: MenuItem[];
  meta: Record<string, any>;
};
