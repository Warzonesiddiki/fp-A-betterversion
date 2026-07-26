import type { Preview } from '@storybook/react';
import '../src/index.css';

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      default: 'dark',
      values: [
        { name: 'dark', value: '#080c14' },
        { name: 'light', value: '#f1f5f9' },
      ],
    },
  },
  initialGlobals: {
    theme: 'dark',
  },
};

export default preview;
