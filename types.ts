
export enum ContentType {
  Carousel = 'Carousel',
  ImagePost = 'Image Post',
  Reel = 'Reel',
}

export interface CarouselSlide {
  id: string;
  imagePrompt: string;
  caption: string;
  imageUrl?: string;
  imageLoading: boolean;
}

export interface ImagePost {
  imagePrompt: string;
  caption: string;
  imageUrl?: string;
}

export interface ReelScript {
  title: string;
  script: string;
}

export interface ReelScene {
  prompt: string;
  videoUrl?: string;
  isLoading: boolean;
  error?: string;
}
