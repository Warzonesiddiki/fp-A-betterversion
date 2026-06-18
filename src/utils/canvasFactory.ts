// =============================================================================
// CANVAS FACTORY (PROMETHEUS PATCH 22 + VULCAN T-FIX-10 ENGINE PURITY REFACTOR)
// =============================================================================
// PATCH 22: Engines must NOT access `document` directly (Veridicus 7 violators)
// Default factories use browser DOM. Tests can inject mocks via setCanvasFactory().
// =============================================================================

export interface CanvasFactory {
  createCanvas(): HTMLCanvasElement;
}

export interface ImageFactory {
  createImage(): HTMLImageElement;
}

export const browserCanvasFactory: CanvasFactory = {
  createCanvas(): HTMLCanvasElement {
    return document.createElement('canvas');
  },
};

export const browserImageFactory: ImageFactory = {
  createImage(): HTMLImageElement {
    return new Image();
  },
};

export let canvasFactory: CanvasFactory = browserCanvasFactory;
export let imageFactory: ImageFactory = browserImageFactory;

export function setCanvasFactory(factory: CanvasFactory): void {
  canvasFactory = factory;
}

export function setImageFactory(factory: ImageFactory): void {
  imageFactory = factory;
}

export function resetCanvasFactory(): void {
  canvasFactory = browserCanvasFactory;
  imageFactory = browserImageFactory;
}

export function createCanvas(): HTMLCanvasElement {
  return canvasFactory.createCanvas();
}

export function createImage(): HTMLImageElement {
  return imageFactory.createImage();
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
