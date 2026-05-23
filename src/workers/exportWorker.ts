type Row = Record<string, unknown>;

self.onmessage = (e: MessageEvent<{ type: 'csv' | 'json'; data: Row[]; columns: string[] }>) => {
  const { type, data, columns } = e.data;
  try {
    if (type === 'csv') {
      const header = columns.map((c) => '"' + c.replace(/"/g, '""') + '"').join(',');
      const rows = data.map((row) =>
        columns
          .map((c) => {
            const val = row[c];
            if (val === null || val === undefined) return '';
            return '"' + String(val).replace(/"/g, '""') + '"';
          })
          .join(',')
      );
      self.postMessage({ result: [header, ...rows].join('\n'), mimeType: 'text/csv' });
    } else {
      self.postMessage({ result: JSON.stringify(data, null, 2), mimeType: 'application/json' });
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    self.postMessage({ error: message });
  }
};
