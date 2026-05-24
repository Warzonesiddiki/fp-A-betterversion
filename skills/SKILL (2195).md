---
name: java-caching-redis-jcache
description: Caching strategies, Redis integration, JCache API, and implementing high-performance caching layers in Java applications.
origin: ECC
---

# Java Caching: Redis & JCache Skill

## Overview
Caching strategies, Redis integration, JCache API, and implementing high-performance caching layers in Java applications.

## Capabilities
- Spring Cache abstraction with Redis
- Redis data structures (strings, hashes, lists, sets, sorted sets)
- JCache (JSR-107) API and providers
- Cache eviction policies and TTL
- Cache-aside, write-through, write-behind patterns
- Redis Cluster and Sentinel
- Distributed caching with invalidation
- Caching annotations and configuration
- Cache statistics and monitoring
- Two-level caching (local + distributed)
- Spring Boot Cache with Redis

## Code Patterns

### Spring Boot Redis Configuration
```java
@Configuration
@EnableCaching
public class RedisConfig {
    @Bean
    public RedisConnectionFactory redisConnectionFactory() {
        RedisStandaloneConfiguration config = new RedisStandaloneConfiguration();
        config.setHostName(host);
        config.setPort(port);
        return new LettuceConnectionFactory(config);
    }

    @Bean
    public RedisCacheManager cacheManager(RedisConnectionFactory connectionFactory) {
        RedisCacheConfiguration config = RedisCacheConfiguration.defaultCacheConfig()
            .entryTtl(Duration.ofMinutes(30))
            .serializeKeysWith(RedisSerializationContext.SerializationPair
                .fromSerializer(new StringRedisSerializer()))
            .serializeValuesWith(RedisSerializationContext.SerializationPair
                .fromSerializer(new GenericJackson2JsonRedisSerializer()))
            .disableCachingNullValues();

        return RedisCacheManager.builder(connectionFactory)
            .cacheDefaults(config)
            .transactionAware()
            .build();
    }
}
```

### Redis Template Operations
```java
@Service
@RequiredArgsConstructor
public class RedisService {
    private final RedisTemplate<String, Object> redisTemplate;

    public void save(String key, Object value) {
        redisTemplate.opsForValue().set(key, value);
    }

    public void saveWithTTL(String key, Object value, long seconds) {
        redisTemplate.opsForValue().set(key, value, Duration.ofSeconds(seconds));
    }

    public Optional<Object> get(String key) {
        Object value = redisTemplate.opsForValue().get(key);
        return Optional.ofNullable(value);
    }

    public void delete(String key) {
        redisTemplate.delete(key);
    }

    public void deleteByPattern(String pattern) {
        Set<String> keys = redisTemplate.keys(pattern);
        if (keys != null && !keys.isEmpty()) {
            redisTemplate.delete(keys);
        }
    }
}
```

### Hash Operations
```java
@Service
@RequiredArgsConstructor
public class UserCacheService {
    private final RedisTemplate<String, Object> redisTemplate;

    public void saveUser(User user) {
        Map<String, Object> userMap = new HashMap<>();
        userMap.put("id", user.getId());
        userMap.put("name", user.getName());
        userMap.put("email", user.getEmail());
        redisTemplate.opsForHash().putAll("user:" + user.getId(), userMap);
    }

    public Optional<User> getUser(String id) {
        Map<Object, Object> entries = redisTemplate.opsForHash().entries("user:" + id);
        if (entries.isEmpty()) return Optional.empty();
        return Optional.of(mapToUser(entries));
    }

    public void updateUserField(String id, String field, Object value) {
        redisTemplate.opsForHash().put("user:" + id, field, value);
    }

    public Long getUserFieldCount(String id) {
        return redisTemplate.opsForHash().size("user:" + id);
    }
}
```

### Sorted Set for Ranking
```java
@Service
@RequiredArgsConstructor
public class LeaderboardService {
    private final RedisTemplate<String, Object> redisTemplate;

    private static final String LEADERBOARD_KEY = "leaderboard:scores";

    public void updateScore(String userId, double score) {
        redisTemplate.opsForZSet().add(LEADERBOARD_KEY, userId, score);
    }

    public List<String> getTopRank(int limit) {
        return redisTemplate.opsForZSet()
            .reverseRange(LEADERBOARD_KEY, 0, limit - 1)
            .stream()
            .map(Object::toString)
            .collect(Collectors.toList());
    }

    public Long getRank(String userId) {
        Long rank = redisTemplate.opsForZSet().reverseRank(LEADERBOARD_KEY, userId);
        return rank != null ? rank + 1 : null;
    }

    public Double getScore(String userId) {
        return redisTemplate.opsForZSet().score(LEADERBOARD_KEY, userId);
    }
}
```

### Spring Cache Annotations
```java
@Service
public class ProductService {
    @Cacheable(value = "products", key = "#id", unless = "#result == null")
    public Product findById(String id) {
        return productRepository.findById(id).orElse(null);
    }

    @Cacheable(value = "products", key = "#category")
    public List<Product> findByCategory(String category) {
        return productRepository.findByCategory(category);
    }

    @CachePut(value = "products", key = "#product.id")
    public Product save(Product product) {
        return productRepository.save(product);
    }

    @CacheEvict(value = "products", key = "#id")
    public void delete(String id) {
        productRepository.deleteById(id);
    }

    @CacheEvict(value = "products", allEntries = true)
    public void clearCache() { }

    @Caching(evict = {
        @CacheEvict(value = "products", key = "#product.id"),
        @CacheEvict(value = "productList", allEntries = true)
    })
    public Product update(Product product) {
        return productRepository.save(product);
    }
}
```

### Cache-Aside Pattern
```java
@Service
@RequiredArgsConstructor
public class CacheAsideProductService {
    private final ProductRepository productRepository;
    private final RedisTemplate<String, Object> redisTemplate;
    private static final String CACHE_PREFIX = "product:";
    private static final Duration TTL = Duration.ofMinutes(30);

    public Product findById(String id) {
        String cacheKey = CACHE_PREFIX + id;
        Product cached = (Product) redisTemplate.opsForValue().get(cacheKey);
        if (cached != null) return cached;

        Product product = productRepository.findById(id).orElse(null);
        if (product != null) {
            redisTemplate.opsForValue().set(cacheKey, product, TTL);
        }
        return product;
    }

    public void update(Product product) {
        productRepository.save(product);
        redisTemplate.opsForValue().set(CACHE_PREFIX + product.getId(), product, TTL);
    }

    public void delete(String id) {
        productRepository.deleteById(id);
        redisTemplate.delete(CACHE_PREFIX + id);
    }
}
```

### Two-Level Caching
```java
@Configuration
@EnableCaching
public class CacheConfig {
    @Bean
    public CacheManager cacheManager() {
        SimpleCacheManager cacheManager = new SimpleCacheManager();
        cacheManager.setCaches(Arrays.asList(
            new ConcurrentMapCache("default"),
            new ConcurrentMapCache("products")
        ));
        return cacheManager;
    }
}

@Service
@RequiredArgsConstructor
public class TwoLevelCacheService {
    @Cacheable(value = "products", key = "#id")
    public Product findById(String id) {
        return databaseService.fetchProductFromDb(id);
    }
}
```

### Redis pub/sub for Cache Invalidation
```java
@Service
public class CacheInvalidationPublisher {
    @Autowired private RedisTemplate<String, Object> redisTemplate;

    public void publishInvalidation(String cacheName, String key) {
        redisTemplate.convertAndSend("cache:invalidate",
            new CacheInvalidationMessage(cacheName, key));
    }
}

@Component
public class CacheInvalidationSubscriber {
    @Autowired private RedisMessageListenerContainer listener;

    @PostConstruct
    public void subscribe() {
        listener.addMessageListener((message, pattern) -> {
            CacheInvalidationMessage msg = deserialize(message);
            Cache cache = cacheManager.getCache(msg.getCacheName());
            cache.evict(msg.getKey());
        }, new PatternTopic("cache:invalidate"));
    }
}
```

### JCache with Redis Provider
```java
@Singleton
public class JCacheProductService {
    private final Cache<String, Product> productCache;

    public JCacheProductService() {
        Configuration<String, Product> config = new MutableConfiguration<String, Product>()
            .setTypes(String.class, Product.class)
            .setExpiryPolicyFactory(AccessedExpiryPolicy.factoryOf(Duration.ONE_MINUTE))
            .setStatisticsEnabled(true);

        CachingProvider provider = Caching.getCachingProvider();
        CacheManager cacheManager = provider.getCacheManager();
        productCache = cacheManager.createCache("products", config);
    }

    public Product getProduct(String id) {
        return productCache.get(id, () -> productRepository.findById(id).orElse(null));
    }

    public void putProduct(String id, Product product) {
        productCache.put(id, product);
    }

    public void invalidate(String id) {
        productCache.remove(id);
    }

    public CacheStatistics getStatistics() {
        return productCache.getStatistics();
    }
}
```

### Redis Cluster Operations
```java
@Configuration
public class RedisClusterConfig {
    @Bean
    public RedisConnectionFactory clusterConnectionFactory() {
        RedisClusterConfiguration config = new RedisClusterConfiguration(
            Arrays.asList("host1:6379", "host2:6379", "host3:6379")
        );
        config.setMaxRedirects(3);
        return new LettuceConnectionFactory(config);
    }
}

// Operations work seamlessly across cluster
@Service
public class ClusterService {
    private final RedisTemplate<String, Object> template;

    public void multiKeyOperation() {
        // Keys can be on different nodes - handled automatically
        template.opsForValue().set("key1", "value1");
        template.opsForValue().set("key2", "value2");
    }
}
```

## Best Practices
- Set appropriate TTL values per cache
- Use cache key prefixes consistently
- Implement cache invalidation for data consistency
- Monitor cache hit/miss ratios
- Handle serialization properly
- Use connection pooling for Redis clients
- Implement cache-aside for reads, write-through for writes
- Consider two-level caching for latency-sensitive operations

## Related Skills
- java-enterprise-patterns
- java-microservices-architect
- java-cloud-native