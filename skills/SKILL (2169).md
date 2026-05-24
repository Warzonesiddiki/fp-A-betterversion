---
name: python-orm-sqlalchemy
description: Database operations using SQLAlchemy ORM
origin: ECC
---

# Python ORM with SQLAlchemy Skill

Use this skill for database operations using SQLAlchemy ORM.

## Setup
```bash
pip install sqlalchemy
pip install flask-sqlalchemy
pip install alembic
pip install psycopg2-binary
pip install pymysql
```

## Engine & Session
```python
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.ext.declarative import declarative_base

engine = create_engine("sqlite:///app.db")
engine = create_engine("postgresql://user:pass@localhost/dbname")
engine = create_engine("mysql+pymysql://user:pass@localhost/dbname")
engine = create_engine("sqlite:///app.db", echo=True)
engine = create_engine("sqlite:///app.db", pool_size=10)

Session = sessionmaker(bind=engine)
session = Session()

Base = declarative_base()
```

## Defining Models

### Basic Model
```python
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True)
    name = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    active = Column(Boolean, default=True)
    
    def __repr__(self):
        return f"<User {self.name}>"

Base.metadata.create_all(engine)
```

### Relationships
```python
class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True)
    name = Column(String(100))
    
    posts = relationship("Post", back_populates="author", cascade="all, delete-orphan")

class Post(Base):
    __tablename__ = "posts"
    
    id = Column(Integer, primary_key=True)
    title = Column(String(200))
    user_id = Column(Integer, ForeignKey("users.id"))
    
    author = relationship("User", back_populates="posts")
```

### Many-to-Many
```python
from sqlalchemy import Table, Column, Integer, String, ForeignKey

tags = Table("tags", Base.metadata,
    Column("post_id", Integer, ForeignKey("posts.id"), primary_key=True),
    Column("tag_id", Integer, ForeignKey("tag.id"), primary_key=True)
)

class Post(Base):
    __tablename__ = "posts"
    id = Column(Integer, primary_key=True)
    
    tags = relationship("Tag", secondary=tags, back_populates="posts")

class Tag(Base):
    __tablename__ = "tag"
    id = Column(Integer, primary_key=True)
    
    posts = relationship("Post", secondary=tags, back_populates="tags")
```

### Self-Referential
```python
class Employee(Base):
    __tablename__ = "employees"
    
    id = Column(Integer, primary_key=True)
    name = Column(String(100))
    manager_id = Column(Integer, ForeignKey("employees.id"))
    
    manager = relationship("Employee", remote_side=[id], backref="direct_reports")
```

## CRUD Operations

### Create
```python
user = User(name="John", email="john@example.com")
session.add(user)
session.commit()
session.refresh(user)

users = [User(name="A"), User(name="B")]
session.add_all(users)
session.commit()
```

### Read
```python
user = session.query(User).get(1)
user = session.query(User).filter_by(name="John").first()
users = session.query(User).filter(User.name == "John").all()
users = session.query(User).filter(User.name.in_(["John", "Jane"])).all()
user = session.query(User).filter(User.name == "John").one()
```

### Update
```python
user = session.query(User).filter_by(name="John").first()
user.name = "John Doe"
session.commit()

session.query(User).filter_by(name="John").update({"name": "John Doe"})
session.commit()
```

### Delete
```python
user = session.query(User).get(1)
session.delete(user)
session.commit()

session.query(User).filter_by(name="John").delete()
session.commit()
```

## Queries

### Filter Conditions
```python
session.query(User).filter(User.name == "John")
session.query(User).filter(User.name != "John")
session.query(User).filter(User.name.like("%John%"))
session.query(User).filter(User.name.ilike("%john%"))
session.query(User).filter(User.name.in_(["John", "Jane"]))
session.query(User).filter(~User.name.in_(["John", "Jane"]))
session.query(User).filter(User.age.between(20, 30))
session.query(User).filter(User.age > 18)
session.query(User).filter(User.active.is_(True))
session.query(User).filter(User.active.isnot(True))
```

### Multiple Filters
```python
session.query(User).filter(
    and_(User.age > 18, User.active == True)
)

session.query(User).filter(
    or_(User.name == "John", User.name == "Jane")
)

session.query(User).filter(
    and_(
        User.age > 18,
        or_(User.name == "John", User.role == "admin")
    )
)
```

### Ordering & Limiting
```python
session.query(User).order_by(User.name)
session.query(User).order_by(User.name.asc())
session.query(User).order_by(User.name.desc())
session.query(User).order_by(User.age, User.name)
session.query(User).limit(10)
session.query(User).offset(20)
session.query(User).limit(10).offset(20)
session.query(User).first()
session.query(User).one()
session.query(User).one_or_none()
session.query(User).all()
```

### Aggregation
```python
from sqlalchemy import func

session.query(func.count(User.id)).scalar()
session.query(func.avg(User.age)).scalar()
session.query(func.sum(User.salary)).scalar()
session.query(func.min(User.age)).scalar()
session.query(func.max(User.age)).scalar()
```

### Group By
```python
from sqlalchemy import func

session.query(
    User.role,
    func.count(User.id)
).group_by(User.role).all()

session.query(
    User.role,
    func.count(User.id).label("count"),
    func.avg(User.age).label("avg_age")
).group_by(User.role).having(func.count(User.id) > 5).all()
```

### Joins
```python
session.query(User).join(Post).filter(Post.id == 1)
session.query(User).join(User.posts).filter(Post.title.like("%Hello%"))

result = session.query(User, Post).join(Post, User.id == Post.user_id).all()
```

## Migrations with Alembic

### Initialize
```bash
alembic init alembic
alembic init alembic -d driver://user:pass@host/db
```

### Configuration (alembic.ini)
```ini
sqlalchemy.url = sqlite:///app.db
```

### Create Migration
```bash
alembic revision -m "add users table"
alembic revision -m "add users table" --autogenerate
```

### Run Migrations
```bash
alembic upgrade head
alembic upgrade +1
alembic downgrade -1
alembic downgrade base
alembic current
alembic history
alembic stamp head
```

### Migration Script Example
```python
def upgrade():
    op.create_table("users",
        op.Column("id", op.Integer(), primary_key=True),
        op.Column("name", op.String(100), nullable=False),
        op.Column("email", op.String(100), unique=True, nullable=False)
    )

def downgrade():
    op.drop_table("users")
```

## Relationships Advanced

### Lazy vs Eager Loading
```python
class User(Base):
    posts = relationship("Post", back_populates="author", lazy="select")
    posts = relationship("Post", back_populates="author", lazy="joined")
    posts = relationship("Post", back_populates="author", lazy="subquery")
    posts = relationship("Post", back_populates="author", lazy="dynamic")
```

### Eager Loading in Queries
```python
from sqlalchemy.orm import joinedload, selectinload

session.query(User).options(joinedload(User.posts)).all()
session.query(User).options(selectinload(User.posts)).all()
session.query(User).options(joinedload(User.posts).joinedload(Post.comments)).all()
```

### Cascade Operations
```python
class Parent(Base):
    __tablename__ = "parent"
    
    id = Column(Integer, primary_key=True)
    children = relationship("Child", cascade="all, delete-orphan")

class Child(Base):
    __tablename__ = "child"
    id = Column(Integer, primary_key=True)
    parent_id = Column(Integer, ForeignKey("parent.id"))
```

## Context Managers
```python
from sqlalchemy.orm import Session

with Session(engine) as session:
    user = session.query(User).filter_by(name="John").first()
    print(user.name)
```

## Raw SQL
```python
from sqlalchemy import text

result = session.execute(text("SELECT * FROM users"))
for row in result:
    print(row)

result = session.execute(
    text("SELECT * FROM users WHERE name = :name"),
    {"name": "John"}
)

session.execute(text("INSERT INTO users (name) VALUES (:name)"), [{"name": "A"}, {"name": "B"}])
session.commit()
```

## Transaction Management
```python
try:
    user = User(name="John", email="john@example.com")
    session.add(user)
    
    post = Post(title="Hello", user_id=user.id)
    session.add(post)
    
    session.commit()
except Exception as e:
    session.rollback()
    raise e
```

## Best Practices
- Use the session as a context manager
- Use bind params to prevent SQL injection
- Use relationships instead of foreign key queries
- Use `lazy="dynamic"` for large collections
- Use `joinedload`/`selectinload` to avoid N+1
- Use transactions for multi-table operations
- Keep sessions short-lived
- Close sessions when done
- Use Alembic for migrations
- Use proper indexes on frequently queried columns
