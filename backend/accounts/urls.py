from django.urls import path

from .views import (
    current_user_view,
    insider_application_view,
    insiders_list_view,
    insider_detail_view,
    login_view,
    logout_view,
    profile_update_view,
    register_view,
    teammate_search_start_view,
    teammate_search_status_view,
)


urlpatterns = [
    path("register/", register_view, name="register"),
    path("login/", login_view, name="login"),
    path("logout/", logout_view, name="logout"),
    path("me/", current_user_view, name="current-user"),
    path("profile/", profile_update_view, name="profile-update"),
    path("insiders/", insiders_list_view, name="insiders-list"),
    path("insiders/<str:username>/", insider_detail_view, name="insider-detail"),
    path("insider-application/", insider_application_view, name="insider-application"),
    path("teammates/search/", teammate_search_status_view, name="teammate-search-status"),
    path("teammates/search/start/", teammate_search_start_view, name="teammate-search-start"),
]
