// Core types adapted from frontend/src/client/types.gen.ts
// and frontend/src/features/movie-domain/api.ts

export type Token = {
  access_token: string;
  token_type?: string;
};

export type Message = {
  message: string;
};

export type UserPublic = {
  id: string;
  username: string;
  full_name?: string | null;
  created_at?: string | null;
  avatar?: string | null;
};

export type UserMe = UserPublic & {
  email: string;
  is_active?: boolean;
  is_superuser?: boolean;
};

export type UserRegister = {
  email: string;
  password: string;
  full_name?: string | null;
  username: string;
};

export type UserUpdateMe = {
  full_name?: string | null;
  email?: string | null;
  username?: string | null;
  avatar?: string | null;
};

export type UpdatePassword = {
  current_password: string;
  new_password: string;
};

export type NewPassword = {
  token: string;
  new_password: string;
};

export type UsersPublic = {
  data: UserPublic[];
  count: number;
};

// Media types

export type MediaType = "movie" | "series";

export type MoviePublic = {
  id: string;
  tmdb_id: number;
  media_type?: MediaType;
  title: string;
  overview?: string | null;
  poster_path?: string | null;
  backdrop_path?: string | null;
  release_date?: string | null;
  tmdb_rating?: number | null;
  genres?: string | null;
  created_at?: string | null;
};

export type MovieSearchResult = {
  external_id: number;
  media_type: MediaType;
  title: string;
  overview?: string | null;
  poster_path?: string | null;
  backdrop_path?: string | null;
  release_date?: string | null;
  rating?: number | null;
  genres: string[];
};

export type MovieSearchResponse = {
  results: MovieSearchResult[];
  page: number;
  total_pages: number;
  total_results: number;
};

export type CastMember = {
  id: number;
  name: string;
  character?: string | null;
  profile_path?: string | null;
};

export type MediaDetails = {
  external_id: number;
  media_type: MediaType;
  title: string;
  overview?: string | null;
  poster_path?: string | null;
  backdrop_path?: string | null;
  release_date?: string | null;
  rating?: number | null;
  genres: string[];
  director?: string | null;
  cast: CastMember[];
};

// Collection types

export type CollectionItemPublic = {
  id: string;
  user_id: string;
  media_id: string;
  collection_name: string;
  rating?: number | null;
  created_at?: string | null;
  media?: MoviePublic | null;
};

export type CollectionItemListPublic = {
  data: CollectionItemPublic[];
  count: number;
};

export type WatchedMoviePublic = {
  id: string;
  user_id: string;
  media_id: string;
  rating?: number | null;
  watched_at?: string | null;
  media?: MoviePublic | null;
};

export type WatchedMoviesPublic = {
  data: WatchedMoviePublic[];
  count: number;
};

export type WatchlistItemPublic = {
  id: string;
  user_id: string;
  media_id: string;
  added_at?: string | null;
  media?: MoviePublic | null;
};

export type WatchlistItemsPublic = {
  data: WatchlistItemPublic[];
  count: number;
};

// Named Collections

export type CollectionMemberPublic = {
  id: string;
  user_id: string;
  role: string;
  joined_at?: string | null;
  user_full_name?: string | null;
  user_email?: string | null;
};

export type CollectionPublic = {
  id: string;
  name: string;
  description?: string | null;
  owner_id: string;
  is_collaborative: boolean;
  created_at?: string | null;
  updated_at?: string | null;
  item_count: number;
  members: CollectionMemberPublic[];
  cover_posters: (string | null)[];
};

export type CollectionListPublic = {
  data: CollectionPublic[];
  count: number;
};

export type CollectionItemPublicNamed = {
  id: string;
  user_id: string;
  media_id: string;
  collection_name?: string | null;
  collection_id?: string | null;
  rating?: number | null;
  position: number;
  created_at?: string | null;
  media?: MoviePublic | null;
};

export type CollectionDetailPublic = CollectionPublic & {
  items: CollectionItemPublicNamed[];
};

export type CollectionInvitationPublic = {
  id: string;
  collection_id: string;
  sender_id: string;
  receiver_id: string;
  status: string;
  created_at?: string | null;
  collection_name?: string | null;
  sender_full_name?: string | null;
};

export type CollectionInvitationListPublic = {
  data: CollectionInvitationPublic[];
  count: number;
};

// Social types

export type FollowStatus = "pending" | "accepted" | "declined";

export type FollowPublic = {
  id: string;
  follower_id: string;
  following_id: string;
  status: FollowStatus;
  created_at?: string | null;
  updated_at?: string | null;
};

export type FollowWithUserPublic = FollowPublic & {
  user: UserPublic;
};

export type FollowsWithUsersPublic = {
  data: FollowWithUserPublic[];
  count: number;
};

export type FollowRequestPublic = {
  follow: FollowPublic;
  requester: UserPublic;
};

export type FollowRequestsPublic = {
  data: FollowRequestPublic[];
  count: number;
};

// Feed types

export type FeedItemPublic = {
  user: UserPublic;
  collection_item: CollectionItemPublic;
};

export type FeedPublic = {
  data: FeedItemPublic[];
  count: number;
};

// User Profile

export type UserProfile = {
  user: UserPublic;
  watched_count: number;
  average_rating?: number | null;
  watched_media?: WatchedMoviePublic[];
  watchlist: WatchlistItemPublic[];
};
