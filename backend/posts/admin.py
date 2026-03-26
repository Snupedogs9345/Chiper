from django.contrib import admin

from .models import Post, PostImage


class PostImageInline(admin.TabularInline):
    model = PostImage
    extra = 0


@admin.register(Post)
class PostAdmin(admin.ModelAdmin):
    list_display = ("title", "author", "created_at")
    search_fields = ("title", "content", "author__username")
    inlines = [PostImageInline]
