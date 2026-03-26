from django.urls import path

from .views import posts_view


urlpatterns = [
    path("", posts_view, name="posts"),
]
