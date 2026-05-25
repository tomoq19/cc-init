## ADDED Requirements

### Requirement: Detect primary language and framework
The system SHALL scan the project root for manifest files and determine the primary language, framework, and package manager.

#### Scenario: Node.js project with Next.js
- **WHEN** the project root contains `package.json` with `"next"` in dependencies
- **THEN** the system SHALL return language=`typescript`, framework=`nextjs`, packageManager detected from lockfile

#### Scenario: Python project with FastAPI
- **WHEN** the project root contains `pyproject.toml` with `fastapi` in dependencies
- **THEN** the system SHALL return language=`python`, framework=`fastapi`, packageManager=`poetry` or `pip`

#### Scenario: Go project
- **WHEN** the project root contains `go.mod`
- **THEN** the system SHALL return language=`go`, framework=`none`, packageManager=`go`

#### Scenario: Rust project
- **WHEN** the project root contains `Cargo.toml`
- **THEN** the system SHALL return language=`rust`, framework=`none`, packageManager=`cargo`

#### Scenario: No manifest files found
- **WHEN** the project root contains none of the known manifest files
- **THEN** the system SHALL return an empty StackProfile and trigger interactive input mode

### Requirement: Detect package manager from lockfiles
The system SHALL determine the package manager by checking for lockfile presence in priority order.

#### Scenario: pnpm detected
- **WHEN** `pnpm-lock.yaml` exists in the project root
- **THEN** the system SHALL set packageManager to `pnpm`

#### Scenario: yarn detected
- **WHEN** `yarn.lock` exists and `pnpm-lock.yaml` does not
- **THEN** the system SHALL set packageManager to `yarn`

#### Scenario: npm fallback
- **WHEN** `package-lock.json` exists or no lockfile is found but `package.json` exists
- **THEN** the system SHALL set packageManager to `npm`

### Requirement: Detect test framework
The system SHALL identify the test framework from devDependencies or config files.

#### Scenario: Vitest detected
- **WHEN** `vitest` is in devDependencies or `vitest.config.*` exists
- **THEN** the system SHALL set testFramework to `vitest`

#### Scenario: Jest detected
- **WHEN** `jest` is in devDependencies or `jest.config.*` exists
- **THEN** the system SHALL set testFramework to `jest`

#### Scenario: Playwright detected
- **WHEN** `@playwright/test` is in devDependencies or `playwright.config.*` exists
- **THEN** the system SHALL set e2eFramework to `playwright`

#### Scenario: pytest detected
- **WHEN** `pytest` is in pyproject.toml dependencies or `conftest.py` exists
- **THEN** the system SHALL set testFramework to `pytest`

### Requirement: Detect database and ORM
The system SHALL identify database tooling from dependencies and config files.

#### Scenario: Prisma detected
- **WHEN** `prisma/` directory exists or `prisma` is in devDependencies
- **THEN** the system SHALL set orm to `prisma`

#### Scenario: Drizzle detected
- **WHEN** `drizzle.config.*` exists or `drizzle-orm` is in dependencies
- **THEN** the system SHALL set orm to `drizzle`

### Requirement: Detect CI/CD pipeline
The system SHALL identify CI/CD systems from known directory structures.

#### Scenario: GitHub Actions detected
- **WHEN** `.github/workflows/` directory exists with at least one YAML file
- **THEN** the system SHALL set ci to `github-actions`

#### Scenario: No CI detected
- **WHEN** no known CI directory or config file exists
- **THEN** the system SHALL set ci to `none`

### Requirement: Detect CSS tooling
The system SHALL identify CSS frameworks and processors.

#### Scenario: Tailwind CSS detected
- **WHEN** `tailwind.config.*` exists or `tailwindcss` is in devDependencies
- **THEN** the system SHALL set cssTooling to include `tailwind`

### Requirement: Detect monorepo structure
The system SHALL identify monorepo configurations.

#### Scenario: Turborepo detected
- **WHEN** `turbo.json` exists in the project root
- **THEN** the system SHALL set monorepo to `turborepo`

#### Scenario: pnpm workspaces detected
- **WHEN** `pnpm-workspace.yaml` exists in the project root
- **THEN** the system SHALL set monorepo to `pnpm-workspaces`

### Requirement: Return structured StackProfile
The system SHALL return all detection results as a single `StackProfile` object.

#### Scenario: Complete profile
- **WHEN** detection completes
- **THEN** the system SHALL return an object with fields: language, framework, packageManager, testFramework, e2eFramework, database, orm, cssTooling, ci, monorepo — each set to detected value or `none`
