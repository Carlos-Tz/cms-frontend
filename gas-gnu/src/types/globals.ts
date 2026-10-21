// Shape of the CMS's site-wide globals endpoint (`/globals`). These values are
// edited once in the CMS admin (Landing Page → Datos de contacto / Redes
// sociales / Botón de WhatsApp) and apply to every page, so `Layout.astro`
// fetches them instead of digging them out of a single page's sections.
export type ContactInfo = {
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  schedule?: string | null;
  additional_info?: string | null;
};

export type SocialNetwork = {
  network: string;
  url?: string | null;
};

export type SocialIcons = {
  networks?: SocialNetwork[];
};

export type WhatsappButton = {
  phone?: string | null;
  prefilled_message?: string | null;
};

export type Testimonial = {
  quote: string;
  author?: string | null;
  role?: string | null;
  photo?: string | null;
};

// Only the "gnu" site currently returns this block; it has no UI yet.
export type Testimonials = {
  title?: string | null;
  items?: Testimonial[];
};

export type Globals = {
  contact_info?: ContactInfo | null;
  social_icons?: SocialIcons | null;
  whatsapp_button?: WhatsappButton | null;
  testimonials?: Testimonials | null;
};

export type GlobalsResponse = {
  status: string;
  data: Globals;
  meta: Record<string, any>;
};
