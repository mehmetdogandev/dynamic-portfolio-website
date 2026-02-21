export type BlogPost = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  image: string;
  imageAlt: string;
  date: string;
};

export type Project = {
  id: string;
  slug: string;
  title: string;
  description: string;
  longDescription: string;
  images: string[];
  imageAlt: string;
  stack: string[];
  links?: { label: string; url: string }[];
  date: string;
  featured?: boolean;
};

export type Experience = {
  id: string;
  title: string;
  company: string;
  location: string;
  startDate: string;
  endDate: string;
  description: string;
};

export type GalleryCategory = {
  id: string;
  name: string;
  images: { url: string; alt: string }[];
};
