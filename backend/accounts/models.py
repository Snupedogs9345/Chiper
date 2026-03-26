from django.conf import settings
from django.db import models


class InsiderApplication(models.Model):
    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        REVIEWED = "reviewed", "Reviewed"
        APPROVED = "approved", "Approved"
        REJECTED = "rejected", "Rejected"

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="insider_application",
        blank=True,
        null=True,
    )
    display_name = models.CharField(max_length=150)
    contact = models.CharField(max_length=255)
    details = models.TextField()
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"{self.display_name} ({self.status})"


class UserProfile(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="profile")
    avatar = models.FileField(upload_to="avatars/", blank=True, null=True)
    is_insider = models.BooleanField(default=False)
    steam_id = models.CharField(max_length=50, blank=True)
    teammate_games = models.TextField(blank=True)

    def __str__(self) -> str:
        return f"Profile for {self.user.username}"


class TeammateSearch(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="teammate_search")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-updated_at"]

    def __str__(self) -> str:
        return f"Teammate search for {self.user.username}"
