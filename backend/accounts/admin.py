from django.contrib import admin

from .models import InsiderApplication, UserProfile


@admin.action(description="Approve selected applications")
def approve_applications(_modeladmin, _request, queryset):
    queryset.update(status=InsiderApplication.Status.APPROVED)
    for application in queryset.select_related("user"):
        if application.user:
            profile, _created = UserProfile.objects.get_or_create(user=application.user)
            profile.is_insider = True
            profile.save(update_fields=["is_insider"])


@admin.register(InsiderApplication)
class InsiderApplicationAdmin(admin.ModelAdmin):
    list_display = ("display_name", "user", "contact", "status", "created_at")
    list_filter = ("status", "created_at")
    search_fields = ("display_name", "contact", "details", "user__username", "user__email")
    actions = [approve_applications]

    def save_model(self, request, obj, form, change):
        super().save_model(request, obj, form, change)
        if obj.user:
            profile, _created = UserProfile.objects.get_or_create(user=obj.user)
            is_insider = obj.status == InsiderApplication.Status.APPROVED
            if profile.is_insider != is_insider:
                profile.is_insider = is_insider
                profile.save(update_fields=["is_insider"])


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "is_insider", "avatar")
    list_filter = ("is_insider",)
    search_fields = ("user__username", "user__email")
