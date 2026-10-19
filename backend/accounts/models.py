from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """Custom user so the model can evolve without a painful swap later."""

    email = models.EmailField(unique=True)
