export interface WPImage {
  id: number;
  source_url: string;
  media_details?: {
    sizes?: {
      full?: { source_url: string };
      medium?: { source_url: string };
      thumbnail?: { source_url: string };
    };
  };
}

export interface WPCategory {
  id: number;
  count: number;
  description: string;
  link: string;
  name: string;
  slug: string;
  taxonomy: string;
}

export interface WPPost {
  id: number;
  date: string;
  slug: string;
  status: string;
  type: string;
  link: string;
  title: {
    rendered: string;
  };
  content: {
    rendered: string;
    protected: boolean;
  };
  excerpt: {
    rendered: string;
    protected: boolean;
  };
  featured_media: number;
  _embedded?: {
    'wp:featuredmedia'?: WPImage[];
    'wp:term'?: WPCategory[][];
  };
  // Custom fields might appear as direct properties or under 'acf' if they installed ACF later
  // Based on user input, they are NOT using custom fields for title, but maybe for others.
  // We will assume standard fields for now.
}
