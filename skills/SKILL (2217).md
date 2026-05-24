---
name: training-material-creation
description: Tutorials, exercises, curricula, and learning paths that build capability through structured, hands-on, and progressive learning experiences.
origin: MCP Market
---

# Training Material Creation

Build training that actually teaches — structured learning paths, hands-on exercises, and clear assessments that transfer knowledge reliably.

## When to Activate

- Creating team training programs
- Writing tutorials for new technologies
- Building learning paths and curricula
- Designing exercises and assessments
- Onboarding training for new hires
- Customer education content

## Learning Theory Basics

### Bloom's Taxonomy in Training

```
Level 1: Remember
───────────────
• Identify terms
• List steps
• Define concepts
Activities: Flashcards, matching, recall quizzes

Level 2: Understand
───────────────
• Explain in own words
• Summarize content
• Classify examples
Activities: Concept maps, analogies, summaries

Level 3: Apply
───────────────
• Use in new situations
• Solve similar problems
• Execute procedures
Activities: Worked examples, practice exercises

Level 4: Analyze
───────────────
• Identify patterns
• Spot errors
• Compare approaches
Activities: Debugging exercises, case studies, critiques

Level 5: Evaluate
───────────────
• Judge quality
• Defend decisions
• Recommend solutions
Activities: Code reviews, design critiques, peer feedback

Level 6: Create
───────────────
• Design solutions
• Build from scratch
• Combine concepts
Activities: Projects, capstone exercises, open challenges
```

### Adult Learning Principles (Andragogy)

```yaml
principles:
  self_direction:
    description: "Adults want to control their learning pace and path"
    implication: "Offer optional advanced sections; let learners skip known content"

  experience:
    description: "Adults bring experience; use it as a resource"
    implication: "Include reflection prompts; connect to real work scenarios"

  relevance:
    description: "Adults need to know why they're learning something"
    implication: "Start with the problem; show the use case before the syntax"

  problem_oriented:
    description: "Adults learn best when solving meaningful problems"
    implication: "Problem-first structure; theory as support, not front-loaded"

  internal_motivation:
    description: "Adults are motivated by internal factors, not external rewards"
    implication: "Connect to career goals; show mastery progression"
```

## Curriculum Design

### Curriculum Template

```markdown
# Course Title

## Course Overview

**Duration:** X hours / Y sessions
**Prerequisites:** List of prerequisites
**Target Audience:** Who this is for

## Learning Objectives

By the end of this course, learners will be able to:
- Objective 1 (Bloom's level: Apply)
- Objective 2 (Bloom's level: Analyze)
- Objective 3 (Bloom's level: Create)

## Course Map

```
Module 1: Foundations (1 hour)
├── Lesson 1.1: Concept introduction
├── Lesson 1.2: Basic syntax
└── Exercise 1: Guided practice

Module 2: Core Patterns (2 hours)
├── Lesson 2.1: Pattern deep-dive
├── Lesson 2.2: Common use cases
└── Exercise 2: Independent practice

Module 3: Advanced Topics (1.5 hours)
├── Lesson 3.1: Advanced pattern
├── Lesson 3.2: Edge cases
└── Exercise 3: Real-world scenario

Capstone: Build a complete solution (2 hours)
```

## Lesson Structure

### 5-Step Lesson Template

```markdown
## Lesson X.X: [Topic Name]

### 1. Learning Objective
By the end of this lesson, you will be able to:
- [Specific, measurable outcome]

### 2. Problem Introduction (5 min)
[Hook: Why does this matter? Present a real problem]

### 3. Concept Explanation (15 min)
[Theory: Explain the concept with diagrams/examples]

### 4. Guided Practice (20 min)
[Hands-on: Walk through together, then solo practice]

### 5. Independent Practice (15 min)
[Exercise: Apply learning without help]

### Key Takeaways
- Takeaway 1
- Takeaway 2

### Further Reading
- [Resource 1](url)
- [Resource 2](url)
```

## Exercise Design

### Exercise Types

```yaml
exercise_types:
  guided:
    description: "Instructor-led walkthrough with scaffolding"
    autonomy: 30%
    time: 20-30 min
    use: "Introducing new concepts"

  structured:
    description: "Given requirements, solve with hints available"
    autonomy: 60%
    time: 30-60 min
    use: "Practice with support nearby"

  open-ended:
    description: "Open problem with multiple valid solutions"
    autonomy: 85%
    time: 60-120 min
    use: "Deepening understanding"

  debugging:
    description: "Find and fix errors in provided code"
    autonomy: 70%
    time: 20-45 min
    use: "Analyzing existing code"

  code_review:
    description: "Review peer code against criteria"
    autonomy: 80%
    time: 30-60 min
    use: "Evaluation and critique"
```

### Exercise Template

```markdown
## Exercise: [Title]

**Difficulty:** Beginner / Intermediate / Advanced
**Duration:** XX minutes
**Prerequisites:** Module X completed

### Problem Statement

[Clear description of what to build or solve]

### Requirements

- [ ] Requirement 1
- [ ] Requirement 2
- [ ] Requirement 3 (stretch goal)

### Starting Point

```python
# Available scaffolding code
def placeholder():
    pass
```

### Success Criteria

| Criterion | Test |
|-----------|------|
| Functional | Code runs without errors |
| Correct | Output matches expected |
| Style | Passes linter |
| Tests | Unit tests pass |

### Hints (if stuck)

1. Hint 1
2. Hint 2
3. Hint 3

### Solution (for reference)

[Hidden — shown after completion or on request]
```

### Worked Example Template

```markdown
## Worked Example: Building a REST Endpoint

### Problem
Create an API endpoint that returns a list of users with pagination.

### Step 1: Understand the Requirements
- Paginated list (limit/offset)
- JSON response format
- Error handling for invalid params

### Step 2: Design the Solution

**Request:**
```
GET /users?limit=10&offset=0
```

**Response:**
```json
{
  "data": [
    { "id": 1, "name": "Alice" },
    { "id": 2, "name": "Bob" }
  ],
  "meta": {
    "total": 100,
    "limit": 10,
    "offset": 0
  }
}
```

### Step 3: Implement

```python
from flask import Flask, jsonify, request

app = Flask(__name__)

@app.route('/users', methods=['GET'])
def get_users():
    # Parse query params
    limit = request.args.get('limit', 10, type=int)
    offset = request.args.get('offset', 0, type=int)

    # Validate
    if limit < 1 or limit > 100:
        return jsonify({"error": "limit must be 1-100"}), 400
    if offset < 0:
        return jsonify({"error": "offset must be non-negative"}), 400

    # Query database
    users = db.users.find().skip(offset).limit(limit)
    total = db.users.count_documents({})

    # Format response
    return jsonify({
        "data": [{"id": u.id, "name": u.name} for u in users],
        "meta": {"total": total, "limit": limit, "offset": offset}
    })
```

### Step 4: Test It

```bash
# Valid request
curl http://localhost:5000/users?limit=2&offset=0
# → Returns 2 users

# Invalid limit
curl http://localhost:5000/users?limit=200
# → 400 error

# Empty result
curl http://localhost:5000/users?limit=10&offset=10000
# → Empty data array
```

### Key Patterns Observed
1. Validate input before processing
2. Use database-native pagination
3. Return consistent envelope format
```

## Assessment Design

### Assessment Types

```yaml
assessments:
  knowledge_check:
    type: quiz
    questions: 10-15
    format: multiple choice, true/false
    weight: 10%
    use: "Verify understanding of concepts"

  skill_demonstration:
    type: exercise
    questions: 3-5
    format: open-ended coding
    weight: 30%
    use: "Apply concepts in practice"

  project:
    type: capstone
    questions: 1
    format: build from scratch
    weight: 40%
    use: "Synthesize learning into a project"

  peer_review:
    type: critique
    questions: 2-3
    format: code review
    weight: 20%
    use: "Evaluate and give feedback"
```

### Quiz Question Examples

```markdown
## Knowledge Check: API Design

**Question 1:** (Remember)
Which HTTP status code indicates a resource was successfully created?

A. 200 OK
B. 201 Created
C. 204 No Content
D. 301 Moved Permanently

---

**Question 2:** (Understand)
Which of the following URL conventions follows best practices?

A. `POST /api/getUserById`
B. `GET /api/users/id/123`
C. `GET /api/users/123`
D. `POST /api/fetch_user?id=123`

---

**Question 3:** (Apply)
A mobile client needs to fetch 50 items per page. Which pagination strategy
is most appropriate?

A. Offset pagination with `?page=2&per_page=50`
B. Cursor pagination with `?cursor=abc`
C. No pagination (fetch all)
D. Client-side pagination

---

**Question 4:** (Analyze)
This response violates REST best practices. Which principle is broken?

```json
{
  "success": true,
  "status": 200,
  "data": { ... }
}
```

A. URL should contain verbs
B. HTTP status codes should be used semantically
C. Response should use XML, not JSON
D. No issue — this is fine
```

## Learning Path Design

### Learning Path Template

```yaml
learning_path:
  title: "API Development Fundamentals"
  duration: "20 hours"
  level: "Beginner to Intermediate"

  modules:
    - title: "HTTP Basics"
      duration: "2 hours"
      lessons: ["HTTP methods", "Status codes", "Headers"]
      exercises: 3

    - title: "REST API Design"
      duration: "4 hours"
      lessons: ["URL structure", "Request/response formats", "Pagination"]
      exercises: 5

    - title: "API Implementation"
      duration: "6 hours"
      lessons: ["Server setup", "Database integration", "Authentication"]
      exercises: 6

    - title: "Testing APIs"
      duration: "4 hours"
      lessons: ["Unit tests", "Integration tests", "Contract testing"]
      exercises: 4

    - title: "Documentation"
      duration: "2 hours"
      lessons: ["OpenAPI specs", "Code examples", "Interactive docs"]
      exercises: 2

  assessments:
    - type: knowledge_check
      timing: end_of_module
    - type: skill_demonstration
      timing: end_of_module
    - type: project
      timing: end_of_path

  certificate:
    requirements:
      - complete_all_modules: true
      - pass_final_project: "> 70%"
      - pass_all_knowledge_checks: "> 80%"
```

## Best Practices

| Practice | Rationale |
|----------|-----------|
| Problem-first structure | Motivation before mechanics; learners know why |
| Hands-on from the start | Reading about code ≠ knowing how to code |
| Scaffolded progression | Too hard too fast causes drop-out |
| Multiple exercise types | Different skills need different practice |
| Immediate feedback | Delay reduces learning impact |
| Real-world relevance | Abstract examples don't transfer |
| Progressive disclosure | Show basics first; advanced details later |
| Regular self-assessment | metacognition improves retention |

## Common Pitfalls

```
Pitfall: "Teaching syntax before problem-solving"
Fix: Lead with the problem; syntax is the solution

Pitfall: "Too much content in one session"
Fix: Chunk into 20-minute modules; break for practice

Pitfall: "No hands-on practice"
Fix: 50/50 rule: half presentation, half exercises

Pitfall: "Exercises are too hard or too easy"
Fix: Scaffold with hints; offer stretch goals for fast learners

Pitfall: "No assessment of learning"
Fix: Add knowledge checks and skill demonstrations throughout

Pitfall: "Content never updated"
Fix: Set review schedule; treat training like a product

Pitfall: "One-size-fits-all curriculum"
Fix: Offer optional advanced tracks; allow self-placement
```

## Related Skills

- `onboarding-process-design` — onboarding training flows
- `technical-writing-standards` — clear, instructional prose
- `documentation-standards` — broader documentation patterns
- `tutorial-and-howto-writing` — tutorial-specific patterns
- `wikis-knowledge-management` — hosting training in wikis
