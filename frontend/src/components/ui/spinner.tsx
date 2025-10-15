import { Loader2, type LucideProps } from 'lucide-react';
import { cn } from '@/lib/utils';

const Spinner = ({ className, ...props }: LucideProps) => {
  return (
    <Loader2 className={cn('animate-spin', className)} {...props} />
  );
};

export default Spinner;