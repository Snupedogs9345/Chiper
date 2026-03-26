from django.contrib import admin
from django.http import JsonResponse
from django.urls import include, path
from django.conf import settings
from django.conf.urls.static import static


def healthcheck(_request):
    return JsonResponse(
        {
            "name": "chiper",
            "status": "ok",
            "message": "Backend is running.",
        }
    )


urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/health/", healthcheck, name="healthcheck"),
    path("api/auth/", include("accounts.urls")),
    path("api/posts/", include("posts.urls")),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
