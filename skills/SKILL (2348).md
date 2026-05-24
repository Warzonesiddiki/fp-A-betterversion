---
name: python-django-advanced
description: Advanced Django patterns including class-based views, custom template tags, middleware, signals, ORM optimization, Django REST Framework advanced features, and production deployment.
origin: ECC
---

# Advanced Django Development

Advanced Django patterns for building production-grade applications.

## When to Activate

- Building complex Django applications
- Optimizing Django ORM queries
- Creating custom Django components
- Advanced REST API development
- Production Django deployments

## Class-Based Views

### Base Views

```python
from django.views.generic import (
    TemplateView, RedirectView, View
)
from django.http import HttpResponse

class HomeView(TemplateView):
    """Simple template view."""
    template_name = 'home.html'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['title'] = 'Welcome'
        return context

class RedirectToDashboard(RedirectView):
    """Redirect view."""
    pattern_name = 'dashboard'

    def get_redirect_url(self, *args, **kwargs):
        if self.request.user.is_authenticated:
            return super().get_redirect_url(*args, **kwargs)
        return reverse('login')

class JSONView(View):
    """Return JSON responses."""
    def get(self, request, *args, **kwargs):
        return JsonResponse({
            'status': 'success',
            'data': {'key': 'value'}
        })
```

### ListView and DetailView

```python
from django.views.generic import ListView, DetailView
from django.core.paginator import Paginator
from .models import Product, Category

class ProductListView(ListView):
    """List products with filtering."""
    model = Product
    template_name = 'products/list.html'
    context_object_name = 'products'
    paginate_by = 12

    def get_queryset(self):
        queryset = super().get_queryset()
        category = self.request.GET.get('category')
        search = self.request.GET.get('q')

        if category:
            queryset = queryset.filter(category__slug=category)
        if search:
            queryset = queryset.filter(name__icontains=search)

        return queryset.select_related('category')

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['categories'] = Category.objects.all()
        return context

class ProductDetailView(DetailView):
    """Product detail view."""
    model = Product
    template_name = 'products/detail.html'
    context_object_name = 'product'

    def get_queryset(self):
        return Product.objects.select_related(
            'category'
        ).prefetch_related('tags', 'reviews')
```

### FormView and CreateView

```python
from django.views.generic import (
    FormView, CreateView, UpdateView, DeleteView
)
from django.urls import reverse_lazy
from .forms import ProductForm
from .models import Product

class ProductCreateView(CreateView):
    """Create new product."""
    model = Product
    form_class = ProductForm
    template_name = 'products/form.html'
    success_url = reverse_lazy('product_list')

    def form_valid(self, form):
        form.instance.created_by = self.request.user
        return super().form_valid(form)

class ProductUpdateView(UpdateView):
    """Update existing product."""
    model = Product
    form_class = ProductForm
    template_name = 'products/form.html'

    def get_queryset(self):
        return Product.objects.filter(
            created_by=self.request.user
        )

class ProductDeleteView(DeleteView):
    """Delete product."""
    model = Product
    template_name = 'products/confirm_delete.html'
    success_url = reverse_lazy('product_list')
```

### Mixins for Reusability

```python
from django.contrib.auth.mixins import LoginRequiredMixin

class ContextMixin:
    """Add common context data."""
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['site_name'] = settings.SITE_NAME
        return context

class TitleMixin:
    """Add page title to context."""
    title = None

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['title'] = self.get_title()
        return context

    def get_title(self):
        return self.title

class ProductListView(ContextMixin, TitleMixin, ListView):
    """Combined mixins."""
    model = Product
    title = 'Products'
    template_name = 'products/list.html'
```

## Custom Template Tags

### Simple Tags

```python
# templatetags/my_tags.py
from django import template

register = template.Library()

@register.simple_tag
def get_site_name():
    """Return site name."""
    from django.conf import settings
    return settings.SITE_NAME

@register.simple_tag
def user_display(user):
    """Return user display name."""
    if user.get_full_name():
        return user.get_full_name()
    return user.username

@register.inclusion_tag('badge.html')
def status_badge(status):
    """Render status badge."""
    colors = {
        'active': 'green',
        'pending': 'yellow',
        'inactive': 'red'
    }
    return {'status': status, 'color': colors.get(status, 'gray')}
```

### Assignment Tags

```python
@register.assignment_tag
def get_recent_products(count=5):
    """Return recent products."""
    return Product.objects.filter(
        is_active=True
    ).order_by('-created_at')[:count]

@register.assignment_tag
def get_user_cart(user):
    """Get user's current cart."""
    try:
        return Cart.objects.get(user=user, status='open')
    except Cart.DoesNotExist:
        return None
```

### Filters

```python
@register.filter
def currency(value):
    """Format as currency."""
    return f'${value:.2f}'

@register.filter
def truncate_words_html(value, length):
    """Truncate HTML content."""
    from django.utils.html import strip_tags
    text = strip_tags(value)
    words = text.split()[:length]
    return ' '.join(words) + '...'

@register.filter
def json_encode(value):
    """Encode to JSON."""
    import json
    return json.dumps(value)
```

## Advanced Middleware

### Django Middleware Classes

```python
# middleware/rate_limit.py
from django.core.cache import cache
from django.http import JsonResponse

class RateLimitMiddleware:
    """Rate limiting middleware."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if not self.should_rate_limit(request):
            return self.get_response(request)

        key = f'rate_limit:{request.ip}'
        limit = 100  # requests per hour
        window = 3600

        count = cache.get(key, 0)
        if count >= limit:
            return JsonResponse(
                {'error': 'Rate limit exceeded'},
                status=429
            )

        cache.set(key, count + 1, window)
        return self.get_response(request)

    def should_rate_limit(self, request):
        return request.path.startswith('/api/')
```

### Middleware with Settings

```python
# middleware/security_headers.py
class SecurityHeadersMiddleware:
    """Add security headers to responses."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)

        response['X-Content-Type-Options'] = 'nosniff'
        response['X-Frame-Options'] = 'DENY'
        response['X-XSS-Protection'] = '1; mode=block'
        response['Referrer-Policy'] = 'strict-origin-when-cross-origin'

        if request.is_secure():
            response['Strict-Transport-Security'] = 'max-age=31536000'

        return response
```

## Signals

### Custom Signals

```python
# signals.py
from django.dispatch import Signal

order_created = Signal()
order_completed = Signal()
payment_received = Signal()

# Sending signals
from django.dispatch import receiver

@receiver(order_created)
def send_order_confirmation(sender, order, **kwargs):
    """Send order confirmation email."""
    send_email(
        to=order.customer.email,
        subject='Order Confirmation',
        template='order_confirmation.html',
        context={'order': order}
    )

@receiver(order_created)
def update_inventory(sender, order, **kwargs):
    """Update inventory after order."""
    for item in order.items.all():
        item.product.stock -= item.quantity
        item.product.save()
```

### Signal Receivers

```python
# models.py
from django.db import models
from django.db.models.signals import pre_save, post_save
from django.dispatch import receiver

class Product(models.Model):
    name = models.CharField(max_length=200)
    slug = models.SlugField(max_length=200)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.name

@receiver(pre_save, sender=Product)
def product_pre_save(sender, instance, **kwargs):
    """Generate slug before saving."""
    if not instance.slug:
        instance.slug = slugify(instance.name)

@receiver(post_save, sender=Product)
def product_post_save(sender, instance, created, **kwargs):
    """Index product after save."""
    if created:
        search_index.add(instance)
```

## ORM Advanced Queries

### Annotations and Aggregations

```python
from django.db.models import (
    Count, Sum, Avg, Max, Min, Q, F, Case, When,
    Value, CharField, IntegerField
)

# Annotations
Product.objects.annotate(
    review_count=Count('reviews')
).filter(review_count__gt=0)

# Multiple aggregations
Product.objects.aggregate(
    total_products=Count('id'),
    avg_price=Avg('price'),
    min_price=Min('price'),
    max_price=Max('price')
)

# Conditional aggregation
from django.db.models import Sum, Case, When, IntegerField

Order.objects.aggregate(
    total_revenue=Sum(
        Case(
            When(status='completed', then=F('total')),
            default=0,
            output_field=IntegerField()
        )
    )
)
```

### Subqueries and Exists

```python
from django.db.models import Exists, OuterRef, Subquery

# Subquery for latest related object
latest_order = Order.objects.filter(
    user=OuterRef('pk')
).order_by('-created_at')[:1]

User.objects.annotate(
    latest_order_date=Subquery(
        latest_order.values('created_at')[:1]
    )
)

# Exists for filtering
active_products = Product.objects.filter(is_active=True)

Category.objects.annotate(
    has_products=Exists(active_products.filter(category=OuterRef('pk')))
).filter(has_products=True)
```

### Raw SQL Queries

```python
from django.db import connection

def get_products_stats():
    """Raw SQL query."""
    with connection.cursor() as cursor:
        cursor.execute("""
            SELECT category_id, COUNT(*) as count, AVG(price) as avg_price
            FROM products
            WHERE is_active = TRUE
            GROUP BY category_id
            ORDER BY count DESC
        """)
        return cursor.fetchall()

# Using RawSQL for computed fields
from django.db.models.functions import Coalesce
from django.db.models import Value

Product.objects.annotate(
    discount_price=Coalesce(
        F('price') * (100 - F('discount__percent')) / 100,
        F('price')
    )
)
```

## DRF Advanced Features

### Custom Viewsets

```python
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response

class ProductViewSet(viewsets.ModelViewSet):
    """Product viewset with custom actions."""
    queryset = Product.objects.all()
    serializer_class = ProductSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        if not self.request.user.is_staff:
            queryset = queryset.filter(is_active=True)
        return queryset

    @action(detail=True, methods=['post'])
    def publish(self, request, pk=None):
        """Publish a product."""
        product = self.get_object()
        product.is_active = True
        product.save()
        return Response({'status': 'published'})

    @action(detail=False, methods=['get'])
    def featured(self, request):
        """Get featured products."""
        products = self.get_queryset().filter(is_featured=True)[:10]
        serializer = self.get_serializer(products, many=True)
        return Response(serializer.data)
```

### Custom Permissions

```python
from rest_framework import permissions

class IsOwnerOrReadOnly(permissions.BasePermission):
    """Allow owners to edit, others to read."""

    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return obj.owner == request.user

class IsAdminUser(permissions.BasePermission):
    """Allow only admin users."""

    def has_permission(self, request, view):
        return request.user and request.user.is_staff

class CustomPermission(permissions.BasePermission):
    """Custom permission logic."""

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_active)

    def has_object_permission(self, request, view, obj):
        return obj.user == request.user or request.user.is_staff
```

### Throttling

```python
from rest_framework.throttling import (
    UserRateThrottle, AnonRateThrottle, ScopedRateThrottle
)

# settings.py
REST_FRAMEWORK = {
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle'
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '100/hour',
        'user': '1000/hour',
        'burst': '60/minute',
    }
}

# views.py
class ProductViewSet(viewsets.ModelViewSet):
    throttle_classes = [UserRateThrottle, AnonRateThrottle]

    @action(throttle_classes=[ScopedRateThrottle], throttle_scope='burst')
    def bulk_create(self, request):
        """Bulk create with different rate limit."""
        pass
```

## Advanced Caching

### Cache Backends

```python
# settings.py - Multiple cache backends
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.redis.RedisCache',
        'LOCATION': 'redis://127.0.0.1:6379/1',
        'OPTIONS': {
            'CLIENT_CLASS': 'django_redis.client.DefaultClient',
        }
    },
    'sessions': {
        'BACKEND': 'django.core.cache.backends.redis.RedisCache',
        'LOCATION': 'redis://127.0.0.1:6379/2',
    }
}

# Session cache
SESSION_ENGINE = 'django.contrib.sessions.backends.cache'
SESSION_CACHE_ALIAS = 'sessions'
```

### Cache as View Decorator

```python
from django.views.decorators.cache import cache_page
from django.utils.decorators import method_decorator

class ProductDetailView(DetailView):
    @method_decorator(cache_page(60 * 15))
    def dispatch(self, *args, **kwargs):
        return super().dispatch(*args, **kwargs)

# URL-based caching
# urls.py
path('products/', cache_page(60 * 10)(ProductListView.as_view()))
```

### Cache Invalidation Patterns

```python
from django.core.cache import cache

def invalidate_product_cache(product_id):
    """Invalidate product cache."""
    cache.delete(f'product:{product_id}')
    cache.delete('products:list')

def invalidate_category_cache(category_id):
    """Invalidate category cache."""
    cache.delete(f'category:{category_id}')
    cache.delete(f'products:category:{category_id}')

# Signal-based invalidation
@receiver(post_save, sender=Product)
def invalidate_product_cache_on_save(sender, instance, **kwargs):
    cache.delete(f'product:{instance.id}')
    cache.delete('products:list')
```

## Production Deployment

### Gunicorn Configuration

```bash
# gunicorn.conf.py
bind = '0.0.0.0:8000'
workers = 4
worker_class = 'sync'
timeout = 120
keepalive = 5
max_requests = 1000
max_requests_jitter = 50

# Logging
accesslog = '/var/log/gunicorn/access.log'
errorlog = '/var/log/gunicorn/error.log'
loglevel = 'info'

# Preload app
preload_app = True
```

### ASGI with Channels

```python
# asgi.py
import os
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'myproject.settings')

application = ProtocolTypeRouter({
    'http': get_asgi_application(),
    'websocket': AuthMiddlewareStack(
        URLRouter([
            # WebSocket routes
        ])
    ),
})
```

## Quick Reference

| Feature | Description |
|---------|-------------|
| ListView | Paginated list with filtering |
| DetailView | Single object display |
| CreateView/UpdateView | Form-based CRUD |
| Template tags | Custom template functions |
| Signals | Event-driven handlers |
| Annotations | Query-time computations |
| Cache framework | Multiple backend support |
| DRF ViewSets | RESTful endpoint patterns |

Remember: Advanced Django means understanding the framework deeply to make it do what you want, not just what it makes easy.