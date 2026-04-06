Create a new feature module. Follow these steps in exact order.

## Step 1: Understand Context
- Read `CLAUDE.md` -> follow links to `docs/PROJECT-RULES.md`
- Read `docs/ARCHITECTURE.md` -> understand where this feature fits
- Read `docs/DATABASE.md` -> check if entity/table already exists
- Read `docs/API_SPEC.md` -> check if endpoints are already defined
- Ask me if anything is unclear before writing code

## Step 2: Create Package Structure
```text
feature/{feature_name}/
|-- {Feature}.java                    # Entity
|-- {Feature}Controller.java          # REST controller
|-- {Feature}Service.java             # Service interface
|-- {Feature}ServiceImpl.java         # Service implementation
|-- {Feature}Repository.java          # JPA repository
`-- dto/
    |-- request/
    |   |-- Create{Feature}Req.java   # Create request DTO (record + validation)
    |   `-- Update{Feature}Req.java   # Update request DTO (record + validation)
    `-- response/
        `-- {Feature}Res.java         # Response DTO (record + fromEntity)
```

Test files (mirror same package under `src/test/java`):
```text
feature/{feature_name}/
|-- {Feature}ServiceImplTest.java     # Unit test - service logic
`-- {Feature}ControllerTest.java      # Integration test - full HTTP flow
```

## Step 3: Implement in This Order
1. **Entity** - fields, JPA annotations, relationships, audit fields
2. **Repository** - extend `JpaRepository`, add custom query methods if needed
3. **DTOs** - request records in `dto/request` with validation, response records in `dto/response` with `fromEntity()`
4. **Service interface** - define contract
5. **Service implementation** - business logic, entity <-> DTO conversion, `@Transactional`
6. **Controller** - endpoints, `@Valid`, wrap response in `ApiResponse`

## Step 4: Write Tests

### Unit Tests - `{Feature}ServiceImplTest.java`
Use:
```java
@ExtendWith(MockitoExtension.class)
```

Mock all dependencies (repository, other services). Test service logic only.

Required test cases per service method:
- **Create**: success, validation fail (duplicate/conflict), related entity not found
- **GetById**: success (found), not found
- **GetAll**: returns list, returns empty list
- **Update**: success, not found, validation fail
- **Delete**: success, not found

Naming: `methodName_scenario_expectedResult`
Every test has `@DisplayName` describing behavior.

### Integration Tests - `{Feature}ControllerTest.java`
Use:
```java
@SpringBootTest
@AutoConfigureMockMvc
```

Test full HTTP flow: request -> controller -> service -> repository -> response.

Required test cases per endpoint:
- **POST**: 201 success, 400 validation error, 409 duplicate, 401 unauthorized
- **GET /{id}**: 200 success, 404 not found, 401 unauthorized
- **GET (list)**: 200 with pagination
- **PUT**: 200 success, 400 validation, 404 not found
- **DELETE**: 200 success, 404 not found

Verify: status code, response body structure (`statusCode`, `data`, `message`), content type.

### What NOT to Test
- Getters/setters on entities
- JPA repository built-in methods
- Simple DTOs with no logic

## Step 5: Follow These Rules
- Constructor injection only (`private final` + constructor)
- Controller injects service interface, not service impl
- All responses wrapped in `ApiResponse<T>`
- `@Valid` on every `@RequestBody`
- Request DTOs must validate required fields, length, and format constraints
- `FetchType.LAZY` on all relationships
- Custom exceptions (`AppException` / project error codes)
- No entity returned from controller - always DTO
- Money fields MUST use `BigDecimal`
- Shared components must come from `com.woodcert.auction.core.*`

## Step 6: Update Documentation
- Update `docs/API_SPEC.md` with new endpoints
- Update `docs/DATABASE.md` if new table/columns are added
- Update the feature `CONTEXT.md`
- Update `docs/PROJECT-STATUS.md`

## Step 7: Verify
- Code compiles with no errors
- All tests pass (old + new)
- No file exceeds 300 lines
- No method exceeds 50 lines
- Check commit checklist in `docs/PROJECT-RULES.md`
