self.onmessage = (
  e: MessageEvent<{ baseValues: number[]; assumptions: { multiplier: number; label: string }[] }>
) => {
  const { baseValues, assumptions } = e.data;
  try {
    const scenarios = assumptions.map((a) => ({
      label: a.label,
      values: baseValues.map((v) => v * a.multiplier),
      total: baseValues.reduce((s, v) => s + v * a.multiplier, 0),
    }));
    self.postMessage({ result: scenarios });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    self.postMessage({ error: message });
  }
};
