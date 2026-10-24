import type { NLQResult } from '@/engines/NLQEngine';

interface JsonRenderSpec {
  [key: string]: unknown;
}

export function nlqResultToSpec(result: NLQResult): JsonRenderSpec {
  const { data, chartConfig, query } = result;

  if (!chartConfig || data.length === 0) {
    return {
      type: 'Card',
      props: { title: 'No Data' },
      children: [
        {
          type: 'Metric',
          props: { label: 'Query', value: query.raw, format: 'text' },
        },
      ],
    };
  }

  const metrics = data.slice(0, 4).map((dp) => ({
    type: 'Metric',
    props: {
      label: dp.label,
      value: dp.value,
      format: dp.value >= 1000 ? 'currency' : 'number',
    },
  }));

  const chart = {
    type: 'Chart',
    props: {
      type: chartConfig.type,
      data: data.map((dp) => ({ label: dp.label, value: dp.value })),
      title: chartConfig.title,
    },
  };

  if (query.intent === 'comparison' && data.length <= 4) {
    return {
      type: 'Grid',
      props: { columns: Math.min(data.length, 4) },
      children: metrics,
    };
  }

  if (query.intent === 'kpi' || data.length === 1) {
    return {
      type: 'Card',
      props: { title: chartConfig.title },
      children: metrics,
    };
  }

  return {
    type: 'Card',
    props: { title: chartConfig.title },
    children: [
      {
        type: 'Grid',
        props: { columns: Math.min(data.length, 4) },
        children: metrics,
      },
      chart,
    ],
  };
}
