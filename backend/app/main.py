import sentry_sdk
from fastapi import APIRouter, FastAPI
from fastapi.routing import APIRoute
from starlette.middleware.cors import CORSMiddleware

from app import models  # noqa: F401
from app.auth.router import router as auth_router
from app.config import settings
from app.feed.router import router as feed_router
from app.follows.router import router as follows_router
from app.media.router import router as media_router
from app.system.private_router import router as private_router
from app.system.router import router as system_router
from app.users.router import router as users_router
from app.watched.router import router as watched_router
from app.watchlist.router import router as watchlist_router

SHOW_DOCS_ENVIRONMENTS = ("local", "staging")


def custom_generate_unique_id(route: APIRoute) -> str:
    return f"{route.tags[0]}-{route.name}"


if settings.SENTRY_DSN and settings.ENVIRONMENT != "local":
    sentry_sdk.init(dsn=str(settings.SENTRY_DSN), enable_tracing=True)

app_kwargs = {
    "title": settings.PROJECT_NAME,
    "generate_unique_id_function": custom_generate_unique_id,
}
if settings.ENVIRONMENT in SHOW_DOCS_ENVIRONMENTS:
    app_kwargs["openapi_url"] = f"{settings.API_V1_STR}/openapi.json"

app = FastAPI(**app_kwargs)

api_router = APIRouter()
api_router.include_router(auth_router)
api_router.include_router(users_router)
api_router.include_router(system_router)
api_router.include_router(media_router)
api_router.include_router(watched_router)
api_router.include_router(watchlist_router)
api_router.include_router(follows_router)
api_router.include_router(feed_router)

if settings.ENVIRONMENT == "local":
    api_router.include_router(private_router)

# Set all CORS enabled origins
if settings.all_cors_origins:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.all_cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

app.include_router(api_router, prefix=settings.API_V1_STR)
