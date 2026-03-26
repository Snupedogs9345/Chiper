import json

from django.contrib.auth import authenticate, login as auth_login, logout as auth_logout
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.db import IntegrityError
from django.http import JsonResponse
from django.shortcuts import get_object_or_404
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST

from .models import InsiderApplication, TeammateSearch, UserProfile
from posts.models import Post


def _parse_json(request):
    try:
        return json.loads(request.body or "{}")
    except json.JSONDecodeError:
        raise ValidationError("Invalid JSON payload.")


def _get_profile(user):
    profile, _created = UserProfile.objects.get_or_create(user=user)
    return profile


def _serialize_user(user, request=None):
    profile = _get_profile(user)
    avatar_url = ""
    if profile.avatar:
        avatar_url = profile.avatar.url
        if request is not None:
            avatar_url = request.build_absolute_uri(avatar_url)

    return {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "avatar_url": avatar_url,
        "is_insider": profile.is_insider,
        "steam_id": profile.steam_id,
        "teammate_games": [game.strip() for game in profile.teammate_games.splitlines() if game.strip()],
    }


def _teammate_games(profile):
    return [game.strip() for game in profile.teammate_games.splitlines() if game.strip()]


def _serialize_match(user, request, common_games):
    profile = _get_profile(user)
    avatar_url = ""
    if profile.avatar:
        avatar_url = request.build_absolute_uri(profile.avatar.url)

    return {
        "id": user.id,
        "username": user.username,
        "avatar_url": avatar_url,
        "steam_id": profile.steam_id,
        "steam_profile_url": f"https://steamcommunity.com/profiles/{profile.steam_id}/" if profile.steam_id else "",
        "games": _teammate_games(profile),
        "common_games": common_games,
    }


def _serialize_search_state(user, request):
    profile = _get_profile(user)
    current_games = _teammate_games(profile)
    search = TeammateSearch.objects.filter(user=user, is_active=True).first()

    matches = []
    if search and current_games:
        active_searches = (
            TeammateSearch.objects.select_related("user", "user__profile")
            .filter(is_active=True)
            .exclude(user=user)
        )
        for candidate_search in active_searches:
            candidate_profile = _get_profile(candidate_search.user)
            candidate_games = _teammate_games(candidate_profile)
            common_games = [game for game in current_games if game in candidate_games]
            if common_games and candidate_profile.steam_id:
                matches.append(_serialize_match(candidate_search.user, request, common_games))

    return {
        "searching": bool(search),
        "games": current_games,
        "matches": matches,
    }


@csrf_exempt
@require_POST
def register_view(request):
    try:
        payload = _parse_json(request)
    except ValidationError as exc:
        return JsonResponse({"errors": {"non_field_errors": [str(exc)]}}, status=400)

    username = str(payload.get("username", "")).strip()
    email = str(payload.get("email", "")).strip().lower()
    password = str(payload.get("password", ""))

    errors: dict[str, list[str]] = {}

    if not username:
        errors.setdefault("username", []).append("Username is required.")
    if not email:
        errors.setdefault("email", []).append("Email is required.")
    if not password:
        errors.setdefault("password", []).append("Password is required.")

    if username and User.objects.filter(username__iexact=username).exists():
        errors.setdefault("username", []).append("This username is already taken.")

    if email and User.objects.filter(email__iexact=email).exists():
        errors.setdefault("email", []).append("This email is already registered.")

    if password:
        try:
            validate_password(password)
        except ValidationError as exc:
            errors["password"] = list(exc.messages)

    if errors:
        return JsonResponse({"errors": errors}, status=400)

    try:
        user = User.objects.create_user(username=username, email=email, password=password)
    except IntegrityError:
        return JsonResponse(
            {"errors": {"username": ["This username is already taken."]}},
            status=400,
        )

    _get_profile(user)
    auth_login(request, user)

    return JsonResponse(
        {
            "message": "User registered successfully.",
            "user": _serialize_user(user, request),
        },
        status=201,
    )


@csrf_exempt
@require_POST
def login_view(request):
    try:
        payload = _parse_json(request)
    except ValidationError as exc:
        return JsonResponse({"errors": {"non_field_errors": [str(exc)]}}, status=400)

    username = str(payload.get("username", "")).strip()
    password = str(payload.get("password", ""))

    errors: dict[str, list[str]] = {}

    if not username:
        errors.setdefault("username", []).append("Username is required.")
    if not password:
        errors.setdefault("password", []).append("Password is required.")

    if errors:
        return JsonResponse({"errors": errors}, status=400)

    user = authenticate(request, username=username, password=password)
    if user is None:
        return JsonResponse(
            {"errors": {"non_field_errors": ["Invalid username or password."]}},
            status=400,
        )

    auth_login(request, user)

    return JsonResponse(
        {
            "message": "Login successful.",
            "user": _serialize_user(user, request),
        }
    )


@csrf_exempt
@require_POST
def logout_view(request):
    auth_logout(request)
    return JsonResponse({"message": "Logout successful."})


def current_user_view(request):
    if not request.user.is_authenticated:
        return JsonResponse({"user": None}, status=401)

    return JsonResponse({"user": _serialize_user(request.user, request)})


def insiders_list_view(request):
    insiders = InsiderApplication.objects.select_related("user", "user__profile").filter(
        status=InsiderApplication.Status.APPROVED
    )

    return JsonResponse(
        {
            "insiders": [
                {
                    "id": insider.id,
                    "name": insider.display_name,
                    "username": insider.user.username if insider.user else insider.display_name,
                    "avatar_url": (
                        request.build_absolute_uri(insider.user.profile.avatar.url)
                        if insider.user and insider.user.profile.avatar
                        else ""
                    ),
                    "contact": insider.contact,
                    "details": insider.details,
                }
                for insider in insiders
            ]
        }
    )


def insider_detail_view(request, username):
    user = get_object_or_404(User.objects.select_related("profile"), username=username)
    profile = _get_profile(user)
    if not profile.is_insider:
        return JsonResponse({"errors": {"non_field_errors": ["Insider not found."]}}, status=404)

    application = (
        InsiderApplication.objects.filter(user=user, status=InsiderApplication.Status.APPROVED)
        .order_by("-created_at")
        .first()
    )
    posts = Post.objects.select_related("author", "author__profile").prefetch_related("images").filter(author=user)

    avatar_url = ""
    if profile.avatar:
        avatar_url = request.build_absolute_uri(profile.avatar.url)

    return JsonResponse(
        {
            "insider": {
                "username": user.username,
                "display_name": application.display_name if application else user.username,
                "avatar_url": avatar_url,
                "contact": application.contact if application else "",
                "details": application.details if application else "",
                "posts": [
                    {
                        "id": post.id,
                        "title": post.title,
                        "content": post.content,
                        "created_at": post.created_at.isoformat(),
                        "images": [request.build_absolute_uri(image.image.url) for image in post.images.all()],
                    }
                    for post in posts
                ],
            }
        }
    )


@csrf_exempt
@require_POST
def profile_update_view(request):
    if not request.user.is_authenticated:
        return JsonResponse({"errors": {"non_field_errors": ["Authentication required."]}}, status=401)

    profile = _get_profile(request.user)
    avatar = request.FILES.get("avatar")
    steam_id = str(request.POST.get("steam_id", "")).strip()
    teammate_games = str(request.POST.get("teammate_games", "")).strip()

    if avatar:
        profile.avatar = avatar
    profile.steam_id = steam_id
    profile.teammate_games = teammate_games
    profile.save()

    return JsonResponse(
        {
            "message": "Profile updated successfully.",
            "user": _serialize_user(request.user, request),
        }
    )


@csrf_exempt
@require_POST
def insider_application_view(request):
    if not request.user.is_authenticated:
        return JsonResponse({"errors": {"non_field_errors": ["Authentication required."]}}, status=401)

    try:
        payload = _parse_json(request)
    except ValidationError as exc:
        return JsonResponse({"errors": {"non_field_errors": [str(exc)]}}, status=400)

    display_name = str(payload.get("display_name", "")).strip()
    contact = str(payload.get("contact", "")).strip()
    details = str(payload.get("details", "")).strip()

    errors: dict[str, list[str]] = {}

    if not display_name:
        errors.setdefault("display_name", []).append("Display name is required.")
    if not contact:
        errors.setdefault("contact", []).append("Contact is required.")
    if not details:
        errors.setdefault("details", []).append("Details are required.")
    if hasattr(request.user, "insider_application"):
        errors.setdefault("non_field_errors", []).append("Insider application already exists for this account.")

    if errors:
        return JsonResponse({"errors": errors}, status=400)

    application = InsiderApplication.objects.create(
        user=request.user,
        display_name=display_name,
        contact=contact,
        details=details,
    )

    return JsonResponse(
        {
            "message": "Insider application submitted.",
            "application": {
                "id": application.id,
                "status": application.status,
            },
        },
        status=201,
    )


def teammate_search_status_view(request):
    if not request.user.is_authenticated:
        return JsonResponse({"errors": {"non_field_errors": ["Authentication required."]}}, status=401)

    return JsonResponse(_serialize_search_state(request.user, request))


@csrf_exempt
@require_POST
def teammate_search_start_view(request):
    if not request.user.is_authenticated:
        return JsonResponse({"errors": {"non_field_errors": ["Authentication required."]}}, status=401)

    profile = _get_profile(request.user)
    games = _teammate_games(profile)

    errors: dict[str, list[str]] = {}
    if not profile.steam_id:
        errors.setdefault("steam_id", []).append("SteamID is required.")
    if not games:
        errors.setdefault("teammate_games", []).append("Select at least one game.")

    if errors:
        return JsonResponse({"errors": errors}, status=400)

    TeammateSearch.objects.update_or_create(
        user=request.user,
        defaults={"is_active": True},
    )

    return JsonResponse(
        {
            "message": "Teammate search started.",
            **_serialize_search_state(request.user, request),
        }
    )
