---
date: 2026-05-19
type: feature
project: FinPlan Pro
tags: [finplan-pro, feature, onboarding, ux]
status: current
---

# Onboarding System

## Overview

Multi-step onboarding wizards guide new users through initial setup.

## Components

### OnboardingWizard (209 lines)
- **Location:** `src/pages/auth/OnboardingWizard.tsx`
- **Purpose:** Post-registration org setup
- **Steps:**
  1. Organization name and industry
  2. Fiscal year configuration
  3. Currency and locale
  4. Team invites (optional)
  5. Dashboard preview

### SetupWizardPage (248 lines)
- **Location:** `src/pages/onboarding/SetupWizardPage.tsx`
- **Purpose:** First-run application configuration
- **Steps:**
  1. GL account structure selection
  2. Budget template selection
  3. Import existing data (optional)
  4. Notification preferences
  5. Completion summary

## Stores Used

- [[auth-rbac]] (authStore) — user session, org ID, role assignment
- `entityStore` — entity/currency config
- `settingsStore` — user preferences
- Links to [[help-system]] for support during onboarding

## Key Patterns

- Progress stepper component for step indication
- Form validation with Zod schemas
- Skip option for optional steps
- Data persisted between steps via local state
- Final step commits all data to stores
