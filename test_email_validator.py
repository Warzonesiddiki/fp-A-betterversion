import pytest
from email_validator import validate_email

@pytest.mark.parametrize("email,expected", [
    ("test@example.com", True),
    ("user.name+tag@example.co.uk", True),
    ("user@sub.domain.com", True),
    ("user_name123@domain.org", True),
    ("invalid-email", False),
    ("user@missingdomain", False),
    ("@example.com", False),
    ("user@", False),
    ("user@domain..com", False),
    ("user..name@example.com", False),
    (".user@example.com", False),
    ("user.@example.com", False),
    ("user@.example.com", False),
    ("user@example.c", False),
    (None, False),
    (123, False),
    ("", False),
    ("   ", False),
])
def test_validate_email(email, expected):
    assert validate_email(email) == expected
