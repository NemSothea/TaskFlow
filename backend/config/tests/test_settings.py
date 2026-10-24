import pytest
from django.core.exceptions import ImproperlyConfigured

from config.settings import require_strong_secret_key


@pytest.mark.parametrize("key", ["", "change-me", "short-but-not-a-placeholder"])
def test_rejects_weak_secret_keys(key):
    with pytest.raises(ImproperlyConfigured):
        require_strong_secret_key(key)


def test_accepts_generated_key():
    from django.core.management.utils import get_random_secret_key

    key = get_random_secret_key()
    assert require_strong_secret_key(key) == key
