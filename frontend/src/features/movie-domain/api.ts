import { CancelablePromise, OpenAPI } from "@/client"
import { request as __request } from "@/client/core/request"

export type Message = {
  message: string
}

export type MediaType = "movie" | "series"

export type MoviePublic = {
  id: string
  tmdb_id: number
  media_type?: MediaType
  title: string
  overview?: string | null
  poster_path?: string | null
  backdrop_path?: string | null
  release_date?: string | null
  tmdb_rating?: number | null
  genres?: string | null
  created_at?: string | null
}

export type MovieSearchResult = {
  external_id: number
  media_type: MediaType
  title: string
  overview?: string | null
  poster_path?: string | null
  backdrop_path?: string | null
  release_date?: string | null
  rating?: number | null
  genres: string[]
}

export type MovieSearchResponse = {
  results: MovieSearchResult[]
  page: number
  total_pages: number
  total_results: number
}

export type WatchlistItemPublic = {
  id: string
  user_id: string
  movie_id: string
  media_id: string
  added_at?: string | null
  movie?: MoviePublic | null
  media?: MoviePublic | null
}

export type WatchlistItemsPublic = {
  data: WatchlistItemPublic[]
  count: number
}

export type WatchedMoviePublic = {
  id: string
  user_id: string
  movie_id: string
  media_id: string
  rating?: number | null
  watched_at?: string | null
  movie?: MoviePublic | null
  media?: MoviePublic | null
}

export type WatchedMoviesPublic = {
  data: WatchedMoviePublic[]
  count: number
}

export type UserPublic = {
  id: string
  email: string
  full_name?: string | null
  is_active?: boolean
  is_superuser?: boolean
  created_at?: string | null
}

export type FollowStatus = "pending" | "accepted" | "declined"

export type FollowPublic = {
  id: string
  follower_id: string
  following_id: string
  status: FollowStatus
  created_at?: string | null
  updated_at?: string | null
}

export type FollowsPublic = {
  data: FollowPublic[]
  count: number
}

export type FollowRequestPublic = {
  follow: FollowPublic
  requester: UserPublic
}

export type FollowRequestsPublic = {
  data: FollowRequestPublic[]
  count: number
}

export type UsersPublic = {
  data: UserPublic[]
  count: number
}

export type UserProfile = {
  user: UserPublic
  watched_count: number
  average_rating?: number | null
  watched_movies: WatchedMoviePublic[]
  watched_media?: WatchedMoviePublic[]
  watchlist: WatchlistItemPublic[]
}

type BackendCollectionItemPublic = {
  id: string
  user_id: string
  media_id: string
  collection_name: string
  rating?: number | null
  created_at?: string | null
  media?: MoviePublic | null
}

type BackendCollectionItemListPublic = {
  data: BackendCollectionItemPublic[]
  count: number
}

type BackendUserProfile = {
  user: UserPublic
  watched_count: number
  average_rating?: number | null
  watched_media?: BackendCollectionItemPublic[]
  watchlist: BackendCollectionItemPublic[]
}

const DEFAULT_MEDIA_TYPE: MediaType = "movie"

function mapCancelablePromise<TIn, TOut>(
  promise: CancelablePromise<TIn>,
  mapper: (value: TIn) => TOut,
): CancelablePromise<TOut> {
  return new CancelablePromise<TOut>((resolve, reject, onCancel) => {
    onCancel(() => promise.cancel())
    promise.then((value) => resolve(mapper(value))).catch(reject)
  })
}

function normalizeCollectionItemToWatchlist(
  item: BackendCollectionItemPublic,
): WatchlistItemPublic {
  return {
    id: item.id,
    user_id: item.user_id,
    media_id: item.media_id,
    movie_id: item.media_id,
    added_at: item.created_at ?? null,
    media: item.media ?? null,
    movie: item.media ?? null,
  }
}

function normalizeCollectionItemToWatched(
  item: BackendCollectionItemPublic,
): WatchedMoviePublic {
  return {
    id: item.id,
    user_id: item.user_id,
    media_id: item.media_id,
    movie_id: item.media_id,
    rating: item.rating ?? null,
    watched_at: item.created_at ?? null,
    media: item.media ?? null,
    movie: item.media ?? null,
  }
}

function normalizeWatchlistResponse(
  response: BackendCollectionItemListPublic,
): WatchlistItemsPublic {
  return {
    data: response.data.map(normalizeCollectionItemToWatchlist),
    count: response.count,
  }
}

function normalizeWatchedResponse(
  response: BackendCollectionItemListPublic,
): WatchedMoviesPublic {
  return {
    data: response.data.map(normalizeCollectionItemToWatched),
    count: response.count,
  }
}

function normalizeUserProfile(profile: BackendUserProfile): UserProfile {
  const watchedMovies = (profile.watched_media ?? []).map(normalizeCollectionItemToWatched)
  return {
    user: profile.user,
    watched_count: profile.watched_count,
    average_rating: profile.average_rating ?? null,
    watched_movies: watchedMovies,
    watched_media: watchedMovies,
    watchlist: profile.watchlist.map(normalizeCollectionItemToWatchlist),
  }
}

export type FeedItemPublic = {
  user: UserPublic
  collection_item: BackendCollectionItemPublic
}

export type FeedPublic = {
  data: FeedItemPublic[]
  count: number
}

export const MovieDomainService = {
  getFeed(data?: {
    skip?: number
    limit?: number
  }): CancelablePromise<FeedPublic> {
    return __request(OpenAPI, {
      method: "GET",
      url: "/api/v1/feed/",
      query: {
        skip: data?.skip ?? 0,
        limit: data?.limit ?? 50,
      },
      errors: {
        422: "Validation Error",
      },
    })
  },

  searchMovies(data: {
    query: string
    page?: number
    media_type?: MediaType
  }): CancelablePromise<MovieSearchResponse> {
    return __request(OpenAPI, {
      method: "GET",
      url: "/api/v1/movies/search",
      query: {
        query: data.query,
        page: data.page ?? 1,
        media_type: data.media_type ?? "movie",
      },
      errors: {
        400: "Bad Request",
        422: "Validation Error",
      },
    })
  },

  getMovie(data: { tmdbId: number }): CancelablePromise<MoviePublic> {
    return __request(OpenAPI, {
      method: "GET",
      url: "/api/v1/movies/{tmdb_id}",
      path: {
        tmdb_id: data.tmdbId,
      },
      errors: {
        404: "Not Found",
        422: "Validation Error",
      },
    })
  },

  listWatched(data?: {
    skip?: number
    limit?: number
  }): CancelablePromise<WatchedMoviesPublic> {
    const promise = __request(OpenAPI, {
      method: "GET",
      url: "/api/v1/collections/watched",
      query: {
        skip: data?.skip ?? 0,
        limit: data?.limit ?? 100,
      },
      errors: {
        422: "Validation Error",
      },
    }) as CancelablePromise<BackendCollectionItemListPublic>
    return mapCancelablePromise(promise, normalizeWatchedResponse)
  },

  markAsWatched(data: {
    tmdb_id: number
    media_type?: MediaType
    rating?: number | null
  }): CancelablePromise<WatchedMoviePublic> {
    const promise = __request(OpenAPI, {
      method: "POST",
      url: "/api/v1/collections/watched",
      body: {
        tmdb_id: data.tmdb_id,
        media_type: data.media_type ?? DEFAULT_MEDIA_TYPE,
        rating: data.rating ?? null,
      },
      mediaType: "application/json",
      errors: {
        400: "Bad Request",
        422: "Validation Error",
      },
    }) as CancelablePromise<BackendCollectionItemPublic>
    return mapCancelablePromise(promise, normalizeCollectionItemToWatched)
  },

  updateWatched(data: {
    id: string
    rating?: number | null
  }): CancelablePromise<WatchedMoviePublic> {
    const promise = __request(OpenAPI, {
      method: "PUT",
      url: "/api/v1/collections/items/{item_id}",
      path: {
        item_id: data.id,
      },
      body: {
        rating: data.rating ?? null,
      },
      mediaType: "application/json",
      errors: {
        404: "Not Found",
        422: "Validation Error",
      },
    }) as CancelablePromise<BackendCollectionItemPublic>
    return mapCancelablePromise(promise, normalizeCollectionItemToWatched)
  },

  removeWatched(data: { id: string }): CancelablePromise<Message> {
    return __request(OpenAPI, {
      method: "DELETE",
      url: "/api/v1/collections/items/{item_id}",
      path: {
        item_id: data.id,
      },
      errors: {
        404: "Not Found",
        422: "Validation Error",
      },
    })
  },

  listWatchlist(data?: {
    skip?: number
    limit?: number
  }): CancelablePromise<WatchlistItemsPublic> {
    const promise = __request(OpenAPI, {
      method: "GET",
      url: "/api/v1/collections/watchlist",
      query: {
        skip: data?.skip ?? 0,
        limit: data?.limit ?? 100,
      },
      errors: {
        422: "Validation Error",
      },
    }) as CancelablePromise<BackendCollectionItemListPublic>
    return mapCancelablePromise(promise, normalizeWatchlistResponse)
  },

  addToWatchlist(data: {
    tmdb_id: number
    media_type?: MediaType
  }): CancelablePromise<WatchlistItemPublic> {
    const promise = __request(OpenAPI, {
      method: "POST",
      url: "/api/v1/collections/watchlist",
      body: {
        tmdb_id: data.tmdb_id,
        media_type: data.media_type ?? DEFAULT_MEDIA_TYPE,
      },
      mediaType: "application/json",
      errors: {
        400: "Bad Request",
        422: "Validation Error",
      },
    }) as CancelablePromise<BackendCollectionItemPublic>
    return mapCancelablePromise(promise, normalizeCollectionItemToWatchlist)
  },

  removeFromWatchlist(data: { id: string }): CancelablePromise<Message> {
    return __request(OpenAPI, {
      method: "DELETE",
      url: "/api/v1/collections/items/{item_id}",
      path: {
        item_id: data.id,
      },
      errors: {
        404: "Not Found",
        422: "Validation Error",
      },
    })
  },

  listFollowers(data?: {
    skip?: number
    limit?: number
  }): CancelablePromise<FollowsPublic> {
    return __request(OpenAPI, {
      method: "GET",
      url: "/api/v1/follows/followers",
      query: {
        skip: data?.skip ?? 0,
        limit: data?.limit ?? 100,
      },
      errors: {
        422: "Validation Error",
      },
    })
  },

  listFollowRequests(data?: {
    skip?: number
    limit?: number
  }): CancelablePromise<FollowRequestsPublic> {
    return __request(OpenAPI, {
      method: "GET",
      url: "/api/v1/follows/requests",
      query: {
        skip: data?.skip ?? 0,
        limit: data?.limit ?? 100,
      },
      errors: {
        422: "Validation Error",
      },
    })
  },

  respondToFollowRequest(data: {
    followId: string
    status: FollowStatus
  }): CancelablePromise<FollowPublic> {
    return __request(OpenAPI, {
      method: "PATCH",
      url: "/api/v1/follows/{follow_id}",
      path: {
        follow_id: data.followId,
      },
      body: {
        status: data.status,
      },
      mediaType: "application/json",
      errors: {
        400: "Bad Request",
        404: "Not Found",
        422: "Validation Error",
      },
    })
  },

  sendFollowRequest(data: { userId: string }): CancelablePromise<FollowPublic> {
    return __request(OpenAPI, {
      method: "POST",
      url: "/api/v1/follows/{user_id}",
      path: {
        user_id: data.userId,
      },
      errors: {
        400: "Bad Request",
        404: "Not Found",
        422: "Validation Error",
      },
    })
  },

  searchUsers(data?: {
    query?: string
    skip?: number
    limit?: number
  }): CancelablePromise<UsersPublic> {
    return __request(OpenAPI, {
      method: "GET",
      url: "/api/v1/users/search",
      query: {
        query: data?.query ?? "",
        skip: data?.skip ?? 0,
        limit: data?.limit ?? 20,
      },
      errors: {
        422: "Validation Error",
      },
    })
  },

  listFollowing(data?: {
    skip?: number
    limit?: number
  }): CancelablePromise<FollowsPublic> {
    return __request(OpenAPI, {
      method: "GET",
      url: "/api/v1/follows/following",
      query: {
        skip: data?.skip ?? 0,
        limit: data?.limit ?? 100,
      },
      errors: {
        422: "Validation Error",
      },
    })
  },

  getUserProfile(data: { userId: string }): CancelablePromise<UserProfile> {
    const promise = __request(OpenAPI, {
      method: "GET",
      url: "/api/v1/users/{user_id}/profile",
      path: {
        user_id: data.userId,
      },
      errors: {
        403: "Forbidden",
        404: "Not Found",
        422: "Validation Error",
      },
    }) as CancelablePromise<BackendUserProfile>
    return mapCancelablePromise(promise, normalizeUserProfile)
  },
}
