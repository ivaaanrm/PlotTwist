import type { CancelablePromise } from "@/client"
import { OpenAPI } from "@/client"
import { request as __request } from "@/client/core/request"

export type Message = {
  message: string
}

export type MoviePublic = {
  id: string
  tmdb_id: number
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
  added_at?: string | null
  movie?: MoviePublic | null
}

export type WatchlistItemsPublic = {
  data: WatchlistItemPublic[]
  count: number
}

export type WatchedMoviePublic = {
  id: string
  user_id: string
  movie_id: string
  rating?: number | null
  watched_at?: string | null
  movie?: MoviePublic | null
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

export type UserProfile = {
  user: UserPublic
  watched_count: number
  average_rating?: number | null
  watched_movies: WatchedMoviePublic[]
  watchlist: WatchlistItemPublic[]
}

export const MovieDomainService = {
  searchMovies(data: {
    query: string
    page?: number
  }): CancelablePromise<MovieSearchResponse> {
    return __request(OpenAPI, {
      method: "GET",
      url: "/api/v1/movies/search",
      query: {
        query: data.query,
        page: data.page ?? 1,
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
    return __request(OpenAPI, {
      method: "GET",
      url: "/api/v1/watched/",
      query: {
        skip: data?.skip ?? 0,
        limit: data?.limit ?? 100,
      },
      errors: {
        422: "Validation Error",
      },
    })
  },

  markAsWatched(data: {
    tmdb_id: number
    rating?: number | null
  }): CancelablePromise<WatchedMoviePublic> {
    return __request(OpenAPI, {
      method: "POST",
      url: "/api/v1/watched/",
      body: data,
      mediaType: "application/json",
      errors: {
        400: "Bad Request",
        422: "Validation Error",
      },
    })
  },

  updateWatched(data: {
    id: string
    rating?: number | null
  }): CancelablePromise<WatchedMoviePublic> {
    return __request(OpenAPI, {
      method: "PATCH",
      url: "/api/v1/watched/{id}",
      path: {
        id: data.id,
      },
      body: {
        rating: data.rating ?? null,
      },
      mediaType: "application/json",
      errors: {
        404: "Not Found",
        422: "Validation Error",
      },
    })
  },

  removeWatched(data: { id: string }): CancelablePromise<Message> {
    return __request(OpenAPI, {
      method: "DELETE",
      url: "/api/v1/watched/{id}",
      path: {
        id: data.id,
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
    return __request(OpenAPI, {
      method: "GET",
      url: "/api/v1/watchlist/",
      query: {
        skip: data?.skip ?? 0,
        limit: data?.limit ?? 100,
      },
      errors: {
        422: "Validation Error",
      },
    })
  },

  addToWatchlist(data: {
    tmdb_id: number
  }): CancelablePromise<WatchlistItemPublic> {
    return __request(OpenAPI, {
      method: "POST",
      url: "/api/v1/watchlist/",
      body: data,
      mediaType: "application/json",
      errors: {
        400: "Bad Request",
        422: "Validation Error",
      },
    })
  },

  removeFromWatchlist(data: { id: string }): CancelablePromise<Message> {
    return __request(OpenAPI, {
      method: "DELETE",
      url: "/api/v1/watchlist/{id}",
      path: {
        id: data.id,
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
    return __request(OpenAPI, {
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
    })
  },
}
