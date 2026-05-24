import { useCallback } from 'react';
import { Image, FileImage } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface ChartExportButtonProps {
  chartRef: React.RefObject<HTMLDivElement | null>;
  filename?: string;
  className?: string;
}

export function ChartExportButton({
  chartRef,
  filename = 'chart',
  className = '',
}: ChartExportButtonProps) {
  const exportAsSVG = useCallback(() => {
    if (!chartRef.current) return;
    const svg = chartRef.current.querySelector('svg');
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.svg`;
    link.click();
    URL.revokeObjectURL(url);
  }, [chartRef, filename]);

  const exportAsPNG = useCallback(() => {
    if (!chartRef.current) return;
    const svg = chartRef.current.querySelector('svg');
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const img = new window.Image();
    img.onload = () => {
      canvas.width = img.width * 2;
      canvas.height = img.height * 2;
      ctx.scale(2, 2);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, img.width, img.height);
      ctx.drawImage(img, 0, 0);
      const link = document.createElement('a');
      link.download = `${filename}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  }, [chartRef, filename]);

  return (
    <div className={`flex gap-1 ${className}`}>
      <Button
        variant="ghost"
        size="sm"
        onClick={exportAsSVG}
        aria-label="Export as SVG"
        title="Export as SVG"
      >
        <FileImage className="h-3 w-3" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={exportAsPNG}
        aria-label="Export as PNG"
        title="Export as PNG"
      >
        <Image className="h-3 w-3" />
      </Button>
    </div>
  );
}
