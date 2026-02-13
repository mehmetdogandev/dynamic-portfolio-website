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

export type Lesson = {
  id: string;
  slug: string;
  title: string;
  description: string;
  image: string;
  imageAlt: string;
  videoCount: number;
  videoIds: string[];
};

export type Teacher = {
  id: string;
  name: string;
  branch: string;
  image: string;
  imageAlt: string;
  shortInfo: string;
};
