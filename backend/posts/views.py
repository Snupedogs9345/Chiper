from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods

from accounts.models import UserProfile

from .models import Post, PostImage


def _serialize_post(post, request):
    avatar_url = ""
    if getattr(post.author.profile, "avatar", None):
        avatar_url = request.build_absolute_uri(post.author.profile.avatar.url)

    return {
        "id": post.id,
        "title": post.title,
        "content": post.content,
        "created_at": post.created_at.isoformat(),
        "author": {
            "username": post.author.username,
            "is_insider": getattr(post.author.profile, "is_insider", False),
            "avatar_url": avatar_url,
        },
        "images": [request.build_absolute_uri(image.image.url) for image in post.images.all()],
    }


@csrf_exempt
@require_http_methods(["GET", "POST"])
def posts_view(request):
    if request.method == "GET":
        posts = Post.objects.select_related("author", "author__profile").prefetch_related("images")
        return JsonResponse({"posts": [_serialize_post(post, request) for post in posts]})

    if not request.user.is_authenticated:
        return JsonResponse({"errors": {"non_field_errors": ["Authentication required."]}}, status=401)

    profile, _created = UserProfile.objects.get_or_create(user=request.user)
    if not profile.is_insider:
        return JsonResponse({"errors": {"non_field_errors": ["Insider role required."]}}, status=403)

    title = str(request.POST.get("title", "")).strip()
    content = str(request.POST.get("content", "")).strip()

    errors: dict[str, list[str]] = {}
    if not title:
        errors.setdefault("title", []).append("Title is required.")
    if not content:
        errors.setdefault("content", []).append("Content is required.")

    if errors:
        return JsonResponse({"errors": errors}, status=400)

    post = Post.objects.create(author=request.user, title=title, content=content)
    for image in request.FILES.getlist("images"):
        PostImage.objects.create(post=post, image=image)

    post = Post.objects.select_related("author", "author__profile").prefetch_related("images").get(pk=post.pk)
    return JsonResponse({"message": "Post published.", "post": _serialize_post(post, request)}, status=201)
