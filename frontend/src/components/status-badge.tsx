import { JOB_STATUS_INFO } from '@/lib/error-messages';

const STATUS_STYLES: Record<string, { bg: string; dot: string }> = {
  PENDING: { bg: 'bg-amber-500/10 text-amber-400', dot: 'bg-amber-400' },
  RUNNING: { bg: 'bg-accent-500/10 text-accent-400', dot: 'bg-accent-400 animate-pulse-soft' },
  COMPLETED: { bg: 'bg-emerald-500/10 text-emerald-400', dot: 'bg-emerald-400' },
  FAILED: { bg: 'bg-red-500/10 text-red-400', dot: 'bg-red-400' },
  Active: { bg: 'bg-emerald-500/10 text-emerald-400', dot: 'bg-emerald-400' },
  Inactive: { bg: 'bg-[#333] text-[#737373]', dot: 'bg-[#525252]' },
  Pending: { bg: 'bg-amber-500/10 text-amber-400', dot: 'bg-amber-400' },
  Enrolled: { bg: 'bg-emerald-500/10 text-emerald-400', dot: 'bg-emerald-400' },
  Failed: { bg: 'bg-red-500/10 text-red-400', dot: 'bg-red-400' },
  Present: { bg: 'bg-emerald-500/10 text-emerald-400', dot: 'bg-emerald-400' },
  Late: { bg: 'bg-amber-500/10 text-amber-400', dot: 'bg-amber-400' },
  Absent: { bg: 'bg-red-500/10 text-red-400', dot: 'bg-red-400' },
};

export function StatusBadge({ status }: { status: string }) {
  const style = STATUS_STYLES[status] ?? { bg: 'bg-[#333] text-[#a3a3a3]', dot: 'bg-[#525252]' };
  const info = JOB_STATUS_INFO[status];
  const label = info?.label ?? status;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${style.bg}`}
      title={info?.description}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
      {label}
    </span>
  );
}
