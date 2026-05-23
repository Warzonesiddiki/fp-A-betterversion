export interface CohortRow {
  cohort: string;
  size: number;
  retention: number[];
}

export interface SaaSCohortTableProps {
  data: CohortRow[];
}

export function SaaSCohortTable({ data }: SaaSCohortTableProps) {
  if (!data.length) return <div className="p-8 text-center text-slate-500">No cohort data</div>;

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-800">
      <table className="w-full text-xs border-collapse">
        <thead className="bg-slate-900 text-slate-400">
          <tr>
            <th className="p-2 border-b border-r border-slate-800 text-left">Cohort</th>
            <th className="p-2 border-b border-r border-slate-800 text-right">Size</th>
            {Array.from({ length: 12 }).map((_, i) => (
              <th key={i} className="p-2 border-b border-slate-800 text-center">
                M{i}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-slate-950">
          {data.map((row, i) => (
            <tr key={i}>
              <td className="p-2 border-r border-slate-800 font-medium text-slate-300">
                {row.cohort}
              </td>
              <td className="p-2 border-r border-slate-800 text-right text-slate-500">
                {row.size}
              </td>
              {row.retention.map((val, j) => {
                const opacity = val / 100;
                return (
                  <td
                    key={j}
                    className="p-2 text-center"
                    style={{
                      backgroundColor: `rgba(59, 130, 246, ${opacity})`,
                      color: opacity > 0.5 ? '#fff' : '#94a3b8',
                    }}
                  >
                    {val}%
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
