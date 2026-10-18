export type ResolvedImage = { src: string; srcSet?: string; width?: number; height?: number };

export type SiteMeta = {
  site: {
    name: string;
    practitioner: string;
    phone: string;
    email: string;
    suburb: string;
    locationNote: string;
    hours: string;
  };
  services: { slug: string; title: string; excerpt: string; duration: string; color: string; icon: string }[];
  posts: { slug: string; title: string; description: string; date: string; draft?: boolean; image?: string }[];
  testimonials: { quote: string; name: string; detail?: string }[];
  images: Record<string, ResolvedImage>;
};

export type Button = { label?: string; link?: string };
