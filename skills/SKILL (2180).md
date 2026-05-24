---
name: python-api-development-flask
description: Building REST APIs with Flask microframework
origin: ECC
---

# Python API Development with Flask Skill

Use this skill for building REST APIs with Flask microframework.

## Setup
```bash
pip install flask
pip install flask-cors flask-restful
pip install flask-sqlalchemy flask-migrate
pip install flask-jwt-extended
pip install marshmallow
pip install gunicorn
```

## Basic App
```python
from flask import Flask, jsonify, request

app = Flask(__name__)

@app.route("/")
def hello():
    return jsonify({"message": "Hello, World!"})

@app.route("/api/users/<int:user_id>")
def get_user(user_id):
    return jsonify({"id": user_id, "name": "John"})

if __name__ == "__main__":
    app.run(debug=True, port=5000)
```

## HTTP Methods

### Routing
```python
@app.route("/api/items", methods=["GET"])
def get_items():
    items = [{"id": 1, "name": "Item 1"}, {"id": 2, "name": "Item 2"}]
    return jsonify(items)

@app.route("/api/items", methods=["POST"])
def create_item():
    data = request.get_json()
    return jsonify({"created": data}), 201

@app.route("/api/items/<int:item_id>", methods=["GET"])
def get_item(item_id):
    item = {"id": item_id, "name": f"Item {item_id}"}
    return jsonify(item)

@app.route("/api/items/<int:item_id>", methods=["PUT"])
def update_item(item_id):
    data = request.get_json()
    return jsonify({"updated": item_id, "data": data})

@app.route("/api/items/<int:item_id>", methods=["DELETE"])
def delete_item(item_id):
    return jsonify({"deleted": item_id}), 204
```

## Request Handling

### Query Parameters
```python
@app.route("/api/search")
def search():
    query = request.args.get("q", "")
    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 10, type=int)
    return jsonify({"query": query, "page": page, "per_page": per_page})
```

### Path Parameters
```python
@app.route("/api/users/<username>")
@app.route("/api/users/<path:full_path>")
@app.route("/api/files/<filename>.<ext>")
```

### Request Headers & Body
```python
@app.route("/api/data")
def get_data():
    auth = request.headers.get("Authorization")
    content_type = request.content_type
    
    if request.is_json:
        data = request.get_json()
    elif request.form:
        data = request.form.to_dict()
    else:
        data = request.get_data()
    
    return jsonify({"received": data})
```

## Response Handling

### JSON Response
```python
from flask import jsonify, make_response

@app.route("/api/response")
def custom_response():
    response = make_response(jsonify({"message": "OK"}))
    response.headers["X-Custom-Header"] = "value"
    response.status_code = 200
    return response
```

### Error Responses
```python
from flask import abort

@app.route("/api/item/<int:item_id>")
def get_item(item_id):
    item = db.get_item(item_id)
    if not item:
        abort(404)
    return jsonify(item)

@app.errorhandler(404)
def not_found(error):
    return jsonify({"error": "Not found"}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({"error": "Internal server error"}), 500
```

## Flask-RESTful

### Resource-Based API
```python
from flask import Flask
from flask_restful import Api, Resource, reqparse

app = Flask(__name__)
api = Api(app)

class HelloWorld(Resource):
    def get(self):
        return {"message": "Hello"}
    
    def post(self):
        return {"message": "Created"}, 201

api.add_resource(HelloWorld, "/api/hello")

class ItemList(Resource):
    def get(self):
        return {"items": items}
    
    def post(self):
        parser = reqparse.RequestParser()
        parser.add_argument("name", required=True, type=str)
        parser.add_argument("price", required=True, type=float)
        args = parser.parse_args()
        return {"item": args}, 201

api.add_resource(ItemList, "/api/items")
```

## Database Integration

### SQLAlchemy Setup
```python
from flask_sqlalchemy import SQLAlchemy

app = Flask(__name__)
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///app.db"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

db = SQLAlchemy(app)

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    
    def to_dict(self):
        return {"id": self.id, "name": self.name, "email": self.email}

@app.route("/api/users", methods=["GET"])
def get_users():
    users = User.query.all()
    return jsonify([u.to_dict() for u in users])

@app.route("/api/users", methods=["POST"])
def create_user():
    data = request.get_json()
    user = User(name=data["name"], email=data["email"])
    db.session.add(user)
    db.session.commit()
    return jsonify(user.to_dict()), 201
```

## Authentication

### JWT Authentication
```python
from flask_jwt_extended import JWTManager, create_access_token, jwt_required

app.config["JWT_SECRET_KEY"] = "secret-key"
jwt = JWTManager(app)

@app.route("/api/login", methods=["POST"])
def login():
    data = request.get_json()
    if data["username"] == "admin" and data["password"] == "secret":
        token = create_access_token(identity="admin")
        return jsonify({"token": token})
    return jsonify({"error": "Invalid credentials"}), 401

@app.route("/api/protected", methods=["GET"])
@jwt_required()
def protected():
    return jsonify({"message": "Protected resource"})
```

## Validation with Marshmallow
```python
from marshmallow import Schema, fields, validate, ValidationError

class UserSchema(Schema):
    name = fields.Str(required=True, validate=validate.Length(min=1, max=100))
    email = fields.Email(required=True)
    age = fields.Int(validate=validate.Range(min=0, max=150))
    role = fields.Str(validate=validate.OneOf(["admin", "user", "guest"]))

user_schema = UserSchema()

@app.route("/api/users", methods=["POST"])
def create_user():
    try:
        data = user_schema.load(request.get_json())
    except ValidationError as err:
        return jsonify(err.messages), 400
    return jsonify(data), 201
```

## CORS
```python
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

CORS(app, resources={r"/api/*": {"origins": "https://example.com"}})
CORS(app, supports_credentials=True)
```

## File Upload
```python
from werkzeug.utils import secure_filename

app.config["UPLOAD_FOLDER"] = "uploads"
app.config["ALLOWED_EXTENSIONS"] = {"png", "jpg", "jpeg", "gif"}

def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in app.config["ALLOWED_EXTENSIONS"]

@app.route("/api/upload", methods=["POST"])
def upload_file():
    if "file" not in request.files:
        return jsonify({"error": "No file"}), 400
    
    file = request.files["file"]
    if file.filename == "":
        return jsonify({"error": "No filename"}), 400
    
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        file.save(os.path.join(app.config["UPLOAD_FOLDER"], filename))
        return jsonify({"filename": filename}), 201
```

## Blueprint Organization
```python
from flask import Blueprint

api = Blueprint("api", __name__, url_prefix="/api")

@api.route("/users")
def get_users():
    return jsonify([])

@api.route("/posts")
def get_posts():
    return jsonify([])

from flask import Flask
app = Flask(__name__)
app.register_blueprint(api)
```

## Testing
```python
import pytest

@pytest.fixture
def client():
    app.config["TESTING"] = True
    with app.test_client() as client:
        with app.app_context():
            db.create_all()
        yield client
        db.drop_all()

def test_get_users(client):
    response = client.get("/api/users")
    assert response.status_code == 200
    assert response.is_json

def test_create_user(client):
    response = client.post("/api/users", 
        json={"name": "John", "email": "john@example.com"})
    assert response.status_code == 201
```

## Production Deployment

### Gunicorn
```bash
gunicorn -w 4 -b 0.0.0.0:8000 app:app
gunicorn -w 4 -b 0.0.0.0:8000 "app:create_app()"
```

### Configuration
```python
import os

class Config:
    SECRET_KEY = os.environ.get("SECRET_KEY", "dev-key")
    SQLALCHEMY_DATABASE_URI = os.environ.get("DATABASE_URL", "sqlite:///app.db")
    JSON_SORT_KEYS = False

class ProductionConfig(Config):
    DEBUG = False

class DevelopmentConfig(Config):
    DEBUG = True
    TESTING = False
```

## Best Practices
- Use blueprints for organization
- Return proper HTTP status codes
- Validate input with Marshmallow
- Use environment variables for config
- Implement proper error handling
- Add rate limiting for production
- Use database transactions
- Log requests and errors
- Cache responses when appropriate
- Document API with OpenAPI/Swagger
