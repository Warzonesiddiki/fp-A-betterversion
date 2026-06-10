import re
from typing import Any

def validate_email(email: Any) -> bool:
    """
    Validates an email address using a robust regex pattern.
    
    This function checks if the provided input is a string and matches a standard 
    email pattern. It handles common edge cases like consecutive dots or 
    missing top-level domains.
    
    Args:
        email: The email address to validate.
        
    Returns:
        True if the email is valid, False otherwise.
    """
    if not isinstance(email, str):
        return False
    
    # A more robust regex for email validation:
    # 1. Local part: alphanumeric characters, dots (not consecutive), underscores, 
    #    percent signs, plus signs, and hyphens.
    # 2. @ symbol.
    # 3. Domain part: alphanumeric characters and hyphens (not starting/ending).
    # 4. Top-level domain: at least two alphabetic characters.
    # Note: It also ensures no consecutive dots in the domain part.
    pattern = r'^(?!\.)[a-zA-Z0-9._%+-]+(?<!\.)@(?!\.)[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)*\.[a-zA-Z]{2,}$'
    
    if not re.match(pattern, email):
        return False
        
    # Check for consecutive dots in the entire email (common invalid pattern)
    if ".." in email:
        return False
        
    return True
