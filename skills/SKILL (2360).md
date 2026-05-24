---
name: java-testing
description: "Effective testing with JUnit 5 and Mockito: structure, patterns, assertions, mocking, test organization, and coverage strategies for Java services."
origin: ECC
---

# Java Testing

Best practices for writing maintainable, readable tests in Java 17+ projects.

## When to Activate

- Writing unit or integration tests for Java services
- Setting up test configuration and fixtures
- Mocking dependencies with Mockito
- Reviewing test quality or coverage
- TDD or BDD workflows

## Test Structure (Arrange-Act-Assert)

```java
@DisplayName("MarketService.findBySlug returns market when exists")
class MarketServiceTest {

    @Mock
    private MarketRepository marketRepository;

    @InjectMocks
    private MarketService marketService;

    @Test
    void findBySlug_returnsMarket_whenExists() {
        // Arrange
        String slug = "nyse";
        Market market = new Market(slug, "NYSE");
        when(marketRepository.findBySlug(slug)).thenReturn(Optional.of(market));

        // Act
        Market result = marketService.findBySlug(slug);

        // Assert
        assertThat(result)
            .isNotNull()
            .extracting(Market::slug, Market::name)
            .containsExactly("nyse", "NYSE");
    }

    @Test
    void findBySlug_throwsException_whenNotFound() {
        when(marketRepository.findBySlug("unknown")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> marketService.findBySlug("unknown"))
            .isInstanceOf(MarketNotFoundException.class)
            .hasMessageContaining("unknown");
    }
}
```

## JUnit 5 Patterns

### Nested Tests for Related Cases

```java
@Nested
@DisplayName("Validation tests")
class ValidationTests {

    @Nested
    @DisplayName("email validation")
    class EmailValidation {
        // grouped related test cases
    }
}
```

### Parameterized Tests

```java
@ParameterizedTest
@CsvSource({
    "john@example.com, true",
    "invalid, false",
    "user+tag@domain.co, true"
})
void emailValidation(String email, boolean expected) {
    assertThat(validator.isValid(email)).isEqualTo(expected);
}

@ParameterizedTest
@MethodSource("provideMarketCases")
void findMarket(MarketQuery query, int expectedCount) { }
```

### Assertions with AssertJ

```java
assertThat(market)
    .isNotNull()
    .hasName("NYSE")
    .hasFieldOrPropertyWithValue("status", MarketStatus.ACTIVE);

assertThat(markets)
    .hasSize(3)
    .extracting(Market::slug)
    .containsExactlyInAnyOrder("nyse", "nasdaq", "lse");

assertThatThrownBy(() -> service.process(null))
    .isInstanceOf(IllegalArgumentException.class)
    .hasMessageContaining("must not be null")
    .hasNoCause();
```

## Mockito Patterns

### Standard Mocking

```java
@ExtendWith(MockitoExtension.class)
class OrderServiceTest {

    @Mock
    private PaymentGateway paymentGateway;

    @Mock
    private NotificationService notificationService;

    @Spy
    private Clock clock = Clock.systemUTC();

    @InjectMocks
    private OrderService orderService;

    @Test
    void processOrder_success() {
        Order order = new Order("ORD-001", new BigDecimal("99.99"));
        when(paymentGateway.charge(any())).thenReturn(TransactionId.of("tx-123"));

        orderService.process(order);

        verify(paymentGateway).charge(order.getAmount());
        verify(notificationService).sendOrderConfirmation(order);
    }

    @Test
    void processOrder_noNotification_whenPaymentFails() {
        when(paymentGateway.charge(any()))
            .thenThrow(new PaymentDeclinedException("Card declined"));

        assertThatThrownBy(() -> orderService.process(new Order()))
            .isInstanceOf(PaymentDeclinedException.class);

        verifyNoInteractions(notificationService);
    }
}
```

### Argument Matchers

```java
verify(repository).save(argThat(market -> 
    market.getSlug() != null && market.getSlug().length() > 0));

when(repository.findByStatusIn(anyList())).thenReturn(List.of());

// Prefer eq() over any() when specific values matter
when(service.calculate(any(), eq(Currency.USD))).thenReturn(money);
```

### Mockito Answer for Complex Behavior

```java
when(paymentGateway.charge(any()))
    .thenAnswer(invocation -> {
        Money amount = invocation.getArgument(0);
        if (amount.isNegative()) {
            throw new PaymentDeclinedException("Negative amount");
        }
        return TransactionId.random();
    });
```

## Test Fixtures

### Object Mother Pattern

```java
class MarketFixtures {
    public static Market nyse() {
        return new Market("nyse", "NYSE", MarketStatus.ACTIVE);
    }
    
    public static Market pendingMarket() {
        return new Market("pending", "PENDING", MarketStatus.PENDING);
    }
}

@Test
void findActiveMarkets_returnsNyse() {
    when(repo.findByStatus(ACTIVE)).thenReturn(List.of(MarketFixtures.nyse()));
    
    List<Market> result = service.findActiveMarkets();
    
    assertThat(result).hasSize(1);
}
```

### Test Data Builders

```java
class MarketBuilder {
    private String slug = "default";
    private String name = "Default Name";
    private MarketStatus status = MarketStatus.ACTIVE;

    public MarketBuilder slug(String slug) { this.slug = slug; return this; }
    public MarketBuilder name(String name) { this.name = name; return this; }
    public MarketBuilder status(MarketStatus status) { this.status = status; return this; }
    public Market build() { return new Market(slug, name, status); }
}

// Usage
Market market = new MarketBuilder().slug("nyse").status(PENDING).build();
```

## Integration Tests

### Spring Boot Test Slices

```java
@SpringBootTest
@AutoConfigureMockMvc
class MarketControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private MarketRepository marketRepository;

    @BeforeEach
    void setUp() {
        marketRepository.deleteAll();
    }

    @Test
    void createMarket_returns201() throws Exception {
        mockMvc.perform(post("/api/markets")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"slug\":\"nyse\",\"name\":\"NYSE\"}"))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.slug").value("nyse"))
            .andExpect(jsonPath("$.id").exists());
    }
}

// Test slice - web only
@WebMvcTest(MarketController.class)
class MarketControllerTest { }

// Test slice - JPA only
@DataJpaTest
class MarketRepositoryTest { }
```

### Testcontainers for Database Tests

```java
@Testcontainers
@DataJpaTest
class MarketRepositoryTest {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:15");

    @DynamicPropertySource
    static void props(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
    }
}
```

## Avoid Common Mistakes

- **No assertions**: Test must verify behavior, not just run code
- **Multiple concerns**: One test = one assertion concept
- **Sleep hacks**: Use `await().atMost()` from Awaitility instead
- **Test order dependency**: Tests must be independent
- **Missing edge cases**: Null, empty, boundary values
- **Overspecification**: Don't verify every mock call unless behavior depends on it

## Test Naming

```
MethodName_StateUnderTest_ExpectedBehavior

findBySlug_existingMarket_returnsMarket
createOrder_nullInput_throwsIllegalArgument
processPayment_declinedCard_throwsAndDoesNotNotify
```

## Coverage Expectations

- Target 80%+ line coverage for business logic
- Critical paths (payment, auth): 100%
- DTOs, records, simple getters: lower priority
- Measure with JaCoCo; review hotspots

**Remember**: Tests are documentation. Write tests you'd want to read when debugging at 2am.
