export interface CastMember {
  id: string;
  name: string;
  character: string;
  profilePath: string | null;
}

export interface Movie {
  id: string;
  title: string;
  description: string;
  releaseDate: string;
  rating: number;
  ratingCount?: number;
  totalRating?: number;
  genres: string[];
  coverImage: string;
  bannerImage?: string;
  cast: string[];
  castMembers?: CastMember[];
  director: string;
  directorId?: string;
  directorProfilePath?: string | null;
  vibe?: string;
  ottReleaseDate?: string;
}

export interface UserList {
  id: string;
  userId: string;
  movieId: string;
  status: 'PLANNING' | 'WATCHING' | 'COMPLETED' | 'DROPPED';
  score?: number;
  updatedAt: string;
}
