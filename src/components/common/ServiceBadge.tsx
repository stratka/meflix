import type { StreamingService } from '../../types/app';

interface Props {
  service: StreamingService;
  size?: 'sm' | 'md';
}

export function ServiceBadge({ service, size = 'md' }: Props) {
  const sizeClass = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-3 py-1';
  return (
    <span
      className={`inline-block rounded-full font-semibold ${sizeClass}`}
      style={{ backgroundColor: service.color, color: service.textColor }}
    >
      {service.name}
    </span>
  );
}
