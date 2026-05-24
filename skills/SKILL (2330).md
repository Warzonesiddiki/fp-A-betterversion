---
name: python-dataclass-pydantic
description: Python dataclasses, Pydantic models, validation, serialization, settings, and advanced patterns for data modeling.
origin: ECC
---

# Dataclasses and Pydantic

Data modeling patterns using Python dataclasses and Pydantic.

## When to Activate

- Data validation and serialization
- Configuration management
- API request/response schemas
- Type-safe data structures

## Python Dataclasses

### Basic Dataclass

```python
from dataclasses import dataclass, field
from typing import Optional
from datetime import datetime

@dataclass
class User:
    """Basic user dataclass."""
    name: str
    email: str
    age: Optional[int] = None
    created_at: datetime = field(default_factory=datetime.now)

    def __post_init__(self):
        """Validation after initialization."""
        if self.age is not None and self.age < 0:
            raise ValueError("Age cannot be negative")

user = User(name="John", email="john@example.com", age=25)
print(user)  # User(name='John', email='john@example.com', age=25, ...)
```

### Dataclass with Methods

```python
from dataclasses import dataclass, field

@dataclass
class Product:
    """Product with computed properties."""
    name: str
    price: float
    discount_percent: float = 0

    @property
    def discounted_price(self) -> float:
        """Calculate discounted price."""
        return self.price * (1 - self.discount_percent / 100)

    def apply_discount(self, percent: float):
        """Apply discount."""
        self.discount_percent = percent

    def __str__(self):
        return f"{self.name} (${self.discounted_price:.2f})"

product = Product("Laptop", 1000, 10)
print(product)  # Laptop ($900.00)
```

### Frozen and Slots

```python
from dataclasses import dataclass

@dataclass(frozen=True)
class ImmutableUser:
    """Immutable user - cannot be modified after creation."""
    name: str
    email: str
    id: int

# Attempting to modify raises FrozenInstanceError
user = ImmutableUser("John", "john@example.com", 1)
# user.name = "Jane"  # Error!

@dataclass(slots=True)
class UserWithSlots:
    """Dataclass using __slots__ for memory efficiency."""
    name: str
    email: str
    age: int

# More memory efficient, no __dict__
```

### Field Factory and Default

```python
from dataclasses import dataclass, field
from typing import List, Dict
import uuid

def generate_id() -> str:
    """Generate unique ID."""
    return str(uuid.uuid4())

@dataclass
class Order:
    """Order with complex defaults."""
    items: List[str] = field(default_factory=list)
    metadata: Dict[str, str] = field(default_factory=dict)
    order_id: str = field(default_factory=generate_id)
    status: str = "pending"

    def add_item(self, item: str):
        """Add item to order."""
        self.items.append(item)

order = Order()
order.add_item("Widget")
print(order)
```

### Custom Field Comparison

```python
from dataclasses import dataclass, field

@dataclass(eq=True)
class Version:
    """Version with custom equality."""
    major: int
    minor: int
    patch: int

    def __lt__(self, other):
        """Compare versions."""
        return (self.major, self.minor, self.patch) < \
               (other.major, other.minor, other.patch)

@dataclass(order=True)
class SortedItem:
    """Items sorted by priority."""
    priority: int = field(compare=True)
    name: str = field(compare=False)

# Can now use sorted(), min(), max()
items = [SortedItem(2, "low"), SortedItem(1, "high")]
print(sorted(items))  # [SortedItem(priority=1, ...), ...]
```

## Pydantic Basics

### Pydantic Models

```python
from pydantic import BaseModel, Field, validator
from typing import Optional
from datetime import datetime

class User(BaseModel):
    """Basic Pydantic model."""
    name: str
    email: str
    age: Optional[int] = None
    created_at: datetime = Field(default_factory=datetime.now)

    class Config:
        populate_by_name = True

user = User(name="John", email="john@example.com")
print(user.model_dump())
```

### Field Validation

```python
from pydantic import BaseModel, Field, validator, field_validator
from typing import Optional, List

class Product(BaseModel):
    """Product with field validation."""
    name: str = Field(..., min_length=1, max_length=200)
    price: float = Field(..., gt=0, description="Product price")
    stock: int = Field(default=0, ge=0)
    tags: List[str] = Field(default_factory=list)

    @field_validator('name')
    @classmethod
    def name_must_be_title(cls, v: str) -> str:
        """Convert name to title case."""
        return v.title()

    @field_validator('price')
    @classmethod
    def validate_price(cls, v: float) -> float:
        """Validate price range."""
        if v > 10000:
            raise ValueError('Price too high')
        return round(v, 2)

product = Product(name="widget", price=9.99)
print(product.name)  # Widget
```

### Model Validation

```python
from pydantic import BaseModel, model_validator, ConfigDict

class Order(BaseModel):
    """Order with cross-field validation."""
    items: List[dict]
    total: float
    shipping_cost: float = 0

    model_config = ConfigDict(str_to_lower=True)

    @model_validator(mode='after')
    def validate_total(self):
        """Validate total matches items."""
        calculated = sum(item['price'] * item['quantity']
                        for item in self.items)
        calculated += self.shipping_cost

        if abs(calculated - self.total) > 0.01:
            raise ValueError('Total does not match items')

        return self

# Validation runs on creation
order = Order(
    items=[{'price': 10, 'quantity': 2}],
    total=20,
    shipping_cost=0
)
```

## Advanced Pydantic

### Nested Models

```python
from pydantic import BaseModel
from typing import List, Optional

class Address(BaseModel):
    """Nested address model."""
    street: str
    city: str
    state: str
    zip_code: str
    country: str = "USA"

class Contact(BaseModel):
    """Contact with nested address."""
    name: str
    email: str
    phone: Optional[str] = None
    address: Address

class Company(BaseModel):
    """Company with multiple contacts."""
    name: str
    contacts: List[Contact]
    headquarters: Address

# Usage
company = Company(
    name="Acme Inc",
    contacts=[
        Contact(
            name="John Doe",
            email="john@acme.com",
            address=Address(
                street="123 Main St",
                city="Boston",
                state="MA",
                zip_code="02101"
            )
        )
    ],
    headquarters=Address(
        street="456 Corporate Way",
        city="Boston",
        state="MA",
        zip_code="02102"
    )
)
```

### Discriminated Unions

```python
from pydantic import BaseModel, Tag
from typing import Union

class Dog(BaseModel):
    """Dog type."""
    pet_type: str = "dog"
    name: str
    bark_volume: int

class Cat(BaseModel):
    """Cat type."""
    pet_type: str = "cat"
    name: str
    meow_volume: int

# Using Union with discriminator
Pet = Dog | Cat

def process_pet(pet: Pet):
    if isinstance(pet, Dog):
        print(f"Dog: {pet.name}, volume: {pet.bark_volume}")
    else:
        print(f"Cat: {pet.name}, volume: {pet.meow_volume}")

# Alternative: discriminated union with Tag
from typing import Annotated

class CatTagged(BaseModel):
    pet_type: str = "cat"
    name: str

class DogTagged(BaseModel):
    pet_type: str = "dog"
    name: str

PetTagged = Annotated[DogTagged, Tag("dog")] | Annotated[CatTagged, Tag("cat")]
```

### Generic Models

```python
from pydantic import BaseModel, GenericModel
from typing import Generic, TypeVar

T = TypeVar('T')

class Container(GenericModel, Generic[T]):
    """Generic container model."""
    items: List[T]
    count: int

    @property
    def is_empty(self) -> bool:
        return self.count == 0

# Usage
int_container = Container[int](items=[1, 2, 3], count=3)
str_container = Container[str](items=["a", "b"], count=2)

class ApiResponse(GenericModel, Generic[T]):
    """Generic API response."""
    data: T
    status: str
    message: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.now)

UserResponse = ApiResponse[User]
product_response = ApiResponse[Product](data=product, status="success")
```

## Pydantic Settings

### Settings Pattern

```python
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List

class Settings(BaseModel):
    """Application settings."""
    app_name: str = "MyApp"
    debug: bool = False

    database_url: str
    redis_url: str

    secret_key: str

    cors_origins: List[str] = []

    class SettingsConfigDict:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False

settings = Settings(
    database_url="postgresql://localhost/db",
    redis_url="redis://localhost",
    secret_key="secret"
)
```

### Nested Settings

```python
from pydantic_settings import BaseSettings
from typing import Optional

class DatabaseSettings(BaseModel):
    """Database configuration."""
    host: str = "localhost"
    port: int = 5432
    name: str = "mydb"
    user: str
    password: str

    @property
    def url(self) -> str:
        return f"postgresql://{self.user}:{self.password}@{self.host}:{self.port}/{self.name}"

class Settings(BaseSettings):
    """Application settings with nested config."""
    app_name: str = "MyApp"
    database: DatabaseSettings

    model_config = SettingsConfigDict(env_file=".env")

# .env file:
# APP_NAME=MyApp
# DATABASE__HOST=localhost
# DATABASE__USER=admin
# DATABASE__PASSWORD=secret
```

## Serialization

### JSON Serialization

```python
from pydantic import BaseModel
from datetime import datetime

class User(BaseModel):
    """User with custom serialization."""
    name: str
    email: str
    created_at: datetime

    def to_json(self) -> str:
        """Convert to JSON string."""
        return self.model_dump_json()

    @classmethod
    def from_json(cls, json_str: str):
        """Create from JSON string."""
        return cls.model_validate_json(json_str)

# Serialization options
user = User(name="John", email="john@example.com", created_at=datetime.now())

# Dict
user.model_dump()  # {'name': 'John', ...}
user.model_dump(exclude={'created_at'})  # Exclude field

# JSON
user.model_dump_json()  # '{"name": "John", ...}'
user.model_dump_json(exclude={'created_at'})

# Parse from dict/json
user2 = User.model_validate(user_dict)
user3 = User.model_validate_json(json_str)
```

### Custom Encoders

```python
from pydantic import BaseModel, field_serializer
from datetime import datetime
from uuid import UUID

class CustomModel(BaseModel):
    """Model with custom serializers."""
    created_at: datetime
    user_id: UUID

    @field_serializer('created_at')
    def serialize_datetime(self, dt: datetime) -> str:
        """Serialize datetime to ISO format."""
        return dt.isoformat()

    @field_serializer('user_id')
    def serialize_uuid(self, uuid: UUID) -> str:
        """Serialize UUID to string."""
        return str(uuid)

# Output: {"created_at": "2024-01-01T00:00:00", "user_id": "..."}
```

## Performance

### Model Performance Tips

```python
from pydantic import BaseModel, ConfigDict
import pydantic

# Use model_config for performance
class OptimizedModel(BaseModel):
    """Optimized Pydantic model."""
    model_config = ConfigDict(
        validate_on_init=False,  # Skip validation on init
        frozen=True,  # Make immutable
        extra='forbid',  # Reject extra fields
        str_strip_whitespace=True,  # Auto-strip strings
    )

    name: str
    value: int

# Benchmark
import time

start = time.perf_counter()
for _ in range(100000):
    OptimizedModel(name="test", value=1)
end = time.perf_counter()
print(f"Time: {end - start:.3f}s")
```

## Integration

### FastAPI Integration

```python
from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()

class Item(BaseModel):
    """Item model for API."""
    name: str
    description: str | None = None
    price: float
    tax: float | None = None

    class Config:
        json_schema_extra = {
            "example": {
                "name": "Foo",
                "description": "A very nice Item",
                "price": 35.4,
                "tax": 3.2,
            }
        }

@app.post("/items/")
async def create_item(item: Item):
    """Create item endpoint."""
    return item.model_dump()

@app.get("/items/{item_id}")
async def read_item(item_id: int):
    """Get item endpoint."""
    return {"item_id": item_id, "name": "Item"}
```

## Quick Reference

| Feature | Description |
|---------|-------------|
| @dataclass | Python data class decorator |
| frozen=True | Immutable dataclass |
| field(default_factory=) | Default factory |
| Pydantic BaseModel | Data validation model |
| field_validator | Field-level validation |
| model_validator | Model-level validation |
| model_config | Model configuration |
| GenericModel | Generic Pydantic model |

Remember: Use dataclasses for simple data containers, Pydantic for external data (API, config, user input).