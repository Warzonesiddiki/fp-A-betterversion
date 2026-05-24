---
name: java-security-spring-security
description: Application security, authentication, authorization, OAuth2, JWT, and securing Java/Spring applications.
origin: ECC
---

# Java Security & Spring Security Skill

## Overview
Application security, authentication, authorization, OAuth2, JWT, and securing Java/Spring applications.

## Capabilities
- Spring Security configuration and customization
- JWT token-based authentication
- OAuth2/OIDC integration
- Role-based and attribute-based access control
- Method-level security
- CSRF, XSS, and common vulnerability protection
- Password encoding (BCrypt, Argon2)
- Session management
- CORS configuration
- Method security with @PreAuthorize
- Security testing

## Code Patterns

### Spring Security Configuration
```java
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {
    private final JwtAuthenticationFilter jwtFilter;
    private final CustomUserDetailsService userDetailsService;
    private final JwtAuthenticationEntryPoint entryPoint;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .exceptionHandling(ex -> ex.authenticationEntryPoint(entryPoint))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/auth/**").permitAll()
                .requestMatchers("/api/public/**").permitAll()
                .requestMatchers("/actuator/health").permitAll()
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                .anyRequest().authenticated())
            .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(12);
    }

    @Bean
    public AuthenticationManager authenticationManager(
            AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }
}
```

### JWT Token Service
```java
@Service
@RequiredArgsConstructor
public class JwtService {
    @Value("${jwt.secret}")
    private String secret;

    @Value("${jwt.expiration}")
    private long expiration;

    public String generateToken(User user) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("roles", user.getRoles().stream()
            .map(Role::getName)
            .collect(Collectors.toList()));
        claims.put("email", user.getEmail());
        return Jwts.builder()
            .setClaims(claims)
            .setSubject(user.getId())
            .setIssuedAt(new Date())
            .setExpiration(new Date(System.currentTimeMillis() + expiration))
            .signWith(Keys.hmacShaKeyFor(secret.getBytes()), SignatureAlgorithm.HS256)
            .compact();
    }

    public Claims extractClaims(String token) {
        return Jwts.parserBuilder()
            .setSigningKey(Keys.hmacShaKeyFor(secret.getBytes()))
            .build()
            .parseClaimsJws(token)
            .getBody();
    }

    public String extractUsername(String token) {
        return extractClaims(token).getSubject();
    }

    public boolean isTokenValid(String token, UserDetails user) {
        final String username = extractUsername(token);
        return username.equals(user.getUsername()) && !isTokenExpired(token);
    }

    private boolean isTokenExpired(String token) {
        return extractClaims(token).getExpiration().before(new Date());
    }
}
```

### JWT Authentication Filter
```java
@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {
    private final JwtService jwtService;
    private final UserDetailsService userDetailsService;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
            HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {

        final String authHeader = request.getHeader("Authorization");
        final String jwt;
        final String username;

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            chain.doFilter(request, response);
            return;
        }

        jwt = authHeader.substring(7);

        try {
            username = jwtService.extractUsername(jwt);

            if (username != null &&
                SecurityContextHolder.getContext().getAuthentication() == null) {

                UserDetails userDetails =
                    userDetailsService.loadUserByUsername(username);

                if (jwtService.isTokenValid(jwt, userDetails)) {
                    UsernamePasswordAuthenticationToken authToken =
                        new UsernamePasswordAuthenticationToken(
                            userDetails, null, userDetails.getAuthorities());
                    authToken.setDetails(
                        new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(authToken);
                }
            }
        } catch (JwtException e) {
            log.error("Invalid JWT token", e);
        }

        chain.doFilter(request, response);
    }
}
```

### Custom UserDetailsService
```java
@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public UserDetails loadUserByUsername(String username)
            throws UsernameNotFoundException {

        User user = userRepository.findByUsername(username)
            .orElseThrow(() -> new UsernameNotFoundException("User not found"));

        return new org.springframework.security.core.userdetails.User(
            user.getUsername(),
            user.getPassword(),
            user.getEnabled(),
            true, true, true,
            user.getRoles().stream()
                .map(role -> new SimpleGrantedAuthority(role.getName()))
                .collect(Collectors.toList())
        );
    }
}
```

### OAuth2 Resource Server
```java
@Configuration
@EnableWebSecurity
public class OAuth2ResourceServerConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .oauth2ResourceServer(oauth2 -> oauth2
                .jwt(jwt -> jwt.jwtDecoder(jwtDecoder())));

        return http.build();
    }

    @Bean
    public JwtDecoder jwtDecoder() {
        return NimbusJwtDecoder.withJwkSetUri(
            "https://auth.example.com/.well-known/jwks.json").build();
    }
}

@Service
public class OAuth2UserService {
    @Autowired private OAuth2UserService<OAuth2User> delegate;

    public OAuth2User loadUser(OAuth2UserRequest request) {
        OAuth2User oauthUser = delegate.loadUser(request);

        // Map to custom user entity
        return new CustomOAuth2User(oauthUser, extractRoles(oauthUser));
    }
}
```

### Method-Level Security
```java
@Service
public class SecuredService {

    @PreAuthorize("hasRole('USER')")
    public String getUserData() {
        return "User data";
    }

    @PreAuthorize("hasAuthority('SCOPE_read:orders')")
    public List<Order> getOrders() {
        return orders;
    }

    @PreAuthorize("#username == authentication.principal.username or hasRole('ADMIN')")
    public User getUserProfile(String username) {
        return userRepository.findByUsername(username);
    }

    @Secured("ROLE_ADMIN")
    public void deleteUser(String id) {
        userRepository.deleteById(id);
    }

    @RolesAllowed({"USER", "ADMIN"})
    public String accessibleByRole() {
        return "Accessible";
    }

    @PostAuthorize("returnObject.owner == authentication.principal.username")
    public Document getDocument(String id) {
        return documentRepository.findById(id);
    }
}
```

### Custom Permission Evaluator
```java
@Component
public class CustomPermissionEvaluator implements PermissionEvaluator {

    @Autowired private DocumentService documentService;

    @Override
    public boolean hasPermission(Authentication authentication,
            Object targetDomainObject, Object permission) {
        if (authentication == null) return false;

        String targetType = targetDomainObject.getClass().getSimpleName();
        String action = (String) permission;

        if ("Document".equals(targetType)) {
            Document doc = (Document) targetDomainObject;
            return documentService.hasAccess(doc.getId(),
                authentication.getName(), action);
        }

        return false;
    }

    @Override
    public boolean hasPermission(Authentication authentication,
            Serializable targetId, String targetType, Object permission) {
        return false;
    }
}

@PreAuthorize("hasPermission(#document, 'READ')")
public Document getDocument(Document document) {
    return document;
}
```

### CORS Configuration
```java
@Configuration
@RequiredArgsConstructor
public class CorsConfig {

    @Bean
    public CorsFilter corsFilter() {
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        CorsConfiguration config = new CorsConfiguration();

        config.setAllowedOrigins(Arrays.asList(
            "http://localhost:3000",
            "https://app.example.com"
        ));
        config.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(Arrays.asList("*"));
        config.setAllowCredentials(true);
        config.setMaxAge(3600L);

        source.registerCorsConfiguration("/api/**", config);

        return new CorsFilter(source);
    }
}
```

### Password Encoding with Argon2
```java
@Configuration
public class PasswordEncoderConfig {

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new Argon2PasswordEncoder(
            16,     // salt length
            32,     // hash length
            1,      // iterations
            1024,   // memory
            2       // parallelism
        );
    }
}

// Usage in registration
@Service
@RequiredArgsConstructor
public class RegistrationService {
    private final PasswordEncoder passwordEncoder;

    public User register(RegistrationRequest request) {
        String encoded = passwordEncoder.encode(request.getPassword());

        User user = User.builder()
            .username(request.getUsername())
            .password(encoded)
            .email(request.getEmail())
            .build();

        return userRepository.save(user);
    }
}
```

### Security Testing
```java
@SpringBootTest
@AutoConfigureMockMvc
class SecurityTest {

    @Autowired private MockMvc mockMvc;

    @Test
    void unauthenticatedRequest_returns401() throws Exception {
        mockMvc.perform(get("/api/protected"))
            .andExpect(status().isUnauthorized());
    }

    @Test
    void validToken_accessGranted() throws Exception {
        String token = jwtService.generateToken(testUser());

        mockMvc.perform(get("/api/protected")
                .header("Authorization", "Bearer " + token))
            .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void adminAccess_returnsOk() throws Exception {
        mockMvc.perform(get("/api/admin"))
            .andExpect(status().isOk());
    }
}

@Sql("/test-data.sql")
class IntegrationSecurityTest { /* ... */ }
```

### CSRF and XSS Protection
```java
@Configuration
public class CsrfConfig {
    @Bean
    public CsrfTokenRepository csrfTokenRepository() {
        return new CookieCsrfTokenRepository();
    }
}

// In Thymeleaf templates
<input type="hidden" name="_csrf" th:value="${_csrf.token}"/>

// XSS: Use Content Security Policy
@Configuration
public class SecurityHeadersConfig {

    @Bean
    public SecurityFilterChain headersFilterChain(HttpSecurity http) throws Exception {
        http
            .headers(headers -> headers
                .contentSecurityPolicy(csp -> csp
                    .policyDirectives("default-src 'self'; script-src 'self'"))
                .xssProtection(xss -> xss.enable())
                .frameOptions(frame -> frame.deny()));

        return http.build();
    }
}
```

## Best Practices
- Use strong password hashing (BCrypt with cost 12+, or Argon2)
- Implement proper JWT token validation
- Use HTTPS everywhere
- Implement proper session management
- Enable CSRF protection (except for APIs)
- Use short-lived access tokens with refresh tokens
- Implement proper logout functionality
- Use parameterized queries to prevent SQL injection
- Keep security dependencies up to date
- Implement proper logging of security events

## Related Skills
- java-enterprise-patterns
- java-microservices-architect
- java-cloud-native