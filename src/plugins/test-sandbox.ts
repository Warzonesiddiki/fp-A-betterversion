import { executeSandboxed } from './PluginSandbox';
import type { PluginAPI } from './types';
import { createLogger } from '@/utils/logger';

const testSandboxLogger = createLogger('TestSandbox');

const mockApi = {} as PluginAPI;
const code = 'return ({}).constructor.constructor("return globalThis")();';
const result = executeSandboxed(code, mockApi);

testSandboxLogger.info('Sandbox result', { result });
