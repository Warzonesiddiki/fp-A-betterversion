declare module '@json-render/core' {
  export interface CatalogComponent {
    props: Record<string, { type: string; description?: string; enum?: string[] }>;
  }

  export interface Catalog {
    [componentName: string]: CatalogComponent;
  }

  export function defineCatalog(schema: Record<string, CatalogComponent>): Catalog;

  export interface RegistryRenderers {
    [componentName: string]: (props: Record<string, unknown>) => unknown;
  }

  export function defineRegistry(renderers: RegistryRenderers): RegistryRenderers;
}

declare module '@json-render/react' {
  import type { FC } from 'react';

  export interface RendererProps {
    catalog: unknown;
    registry: unknown;
    data: unknown;
  }

  export const Renderer: FC<RendererProps>;
}
