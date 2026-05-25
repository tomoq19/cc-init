## ADDED Requirements

### Requirement: Prompt for stack when detection is insufficient
The system SHALL prompt the user interactively when auto-detection cannot determine key stack components.

#### Scenario: No manifest files found
- **WHEN** StackProfile returns with language=`none`
- **THEN** the system SHALL prompt the user to select: language, framework, package manager, test framework, and database

#### Scenario: Partial detection
- **WHEN** StackProfile detects language but not framework
- **THEN** the system SHALL prompt the user only for the missing fields, pre-filling detected values

### Requirement: Confirmation before generation
The system SHALL display a summary of the detected (or input) stack and ask the user to confirm before generating files.

#### Scenario: User confirms detected stack
- **WHEN** the system displays the StackProfile summary and user confirms
- **THEN** the system SHALL proceed with config generation

#### Scenario: User corrects detected stack
- **WHEN** the system displays the StackProfile summary and user requests corrections
- **THEN** the system SHALL allow the user to modify individual fields and re-display the summary

### Requirement: Non-interactive mode
The system SHALL support a `--yes` flag that skips confirmation prompts and uses detected values directly.

#### Scenario: CI environment
- **WHEN** user runs `cc-init --yes`
- **THEN** the system SHALL skip all confirmation prompts and generate using detected values
- **THEN** the system SHALL exit with error code 1 if detection returns language=`none` (cannot proceed without interactive input)
