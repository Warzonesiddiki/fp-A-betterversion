import { executeSandboxed } from './PluginSandbox';
import type { PluginAPI } from './types';

const mockApi = {} as PluginAPI;
const code = 'return ({}).constructor.constructor("return globalThis")();';
const result = executeSandboxed(code, mockApi);

console.log('Result:', result);
