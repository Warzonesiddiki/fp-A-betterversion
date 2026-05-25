/**
 * Demo Data Seeder for FinPlan Pro
 * Populates stores with sample data for new users
 * Only seeds if stores are empty (won't overwrite real data)
 */

import { budgets, forecasts, scenarios, entities, mockGLEntries } from '@/services/mockData';
import { useBudgetStore } from '@/store/budgetStore';
import { useForecastStore } from '@/store/forecastStore';
import { useScenarioStore } from '@/store/scenarioStore';
import { useGLStore } from '@/store/glStore';
import { useEntityStore } from '@/store/entityStore';
import { createLogger } from './logger';

const logger = createLogger('DemoDataSeeder');

export function seedDemoData(): { success: boolean; message: string } {
  try {
    logger.info('Starting demo data seeding...');

    // Check if stores already have data
    const budgetState = useBudgetStore.getState();
    const _glState = useGLStore.getState();
    const _entityState = useEntityStore.getState();

    if (budgetState.budgets.length > 0) {
      logger.info('Budgets already exist, skipping seed');
      return { success: true, message: 'Data already exists, skipping seed' };
    }

    // Seed entities
    logger.info('Seeding entities...');
    const entityStore = useEntityStore.getState();
    for (const entity of entities) {
      entityStore.addEntity(entity);
    }

    // Seed budgets
    logger.info('Seeding budgets...');
    const budgetStore = useBudgetStore.getState();
    for (const budget of budgets) {
      budgetStore.createBudget(budget);
    }

    // Seed forecasts
    logger.info('Seeding forecasts...');
    const forecastStore = useForecastStore.getState();
    for (const forecast of forecasts) {
      forecastStore.createForecast(forecast);
    }

    // Seed scenarios
    logger.info('Seeding scenarios...');
    const scenarioStore = useScenarioStore.getState();
    for (const scenario of scenarios) {
      scenarioStore.createScenario(scenario);
    }

    // Seed GL entries
    logger.info('Seeding GL entries...');
    const glStore = useGLStore.getState();
    for (const entry of mockGLEntries) {
      glStore.addEntry(entry);
    }

    logger.info('Demo data seeding complete');
    return { success: true, message: 'Demo data seeded successfully' };
  } catch (error) {
    logger.error('Failed to seed demo data', { error });
    return { success: false, message: `Seeding failed: ${error}` };
  }
}

export function clearDemoData(): { success: boolean; message: string } {
  try {
    logger.info('Clearing demo data...');

    // Reset stores to initial state
    useBudgetStore.setState({ budgets: [] });
    useForecastStore.setState({ forecasts: [] });
    useScenarioStore.setState({ scenarios: [] });
    useGLStore.setState({ entries: [] });

    logger.info('Demo data cleared');
    return { success: true, message: 'Demo data cleared successfully' };
  } catch (error) {
    logger.error('Failed to clear demo data', { error });
    return { success: false, message: `Clear failed: ${error}` };
  }
}
