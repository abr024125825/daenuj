import logo from '@/assets/logo-transparent.png';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
}

const sizeClasses = {
  sm: 'h-10 w-10',
  md: 'h-14 w-14',
  lg: 'h-20 w-20',
  xl: 'h-28 w-28',
};

export function Logo({ size = 'md', showText = true }: LogoProps) {
  return (
    <div className="flex items-center gap-3">
      <img
        src={logo}
        alt="Dean of Student Affairs Logo"
        className={`${sizeClasses[size]} object-contain`}
      />
      {showText && (
        <div className="flex flex-col">
          <span className="font-display font-bold text-foreground leading-tight">
            Dean of Student Affairs
          </span>
          <span className="font-display text-sm text-muted-foreground">
            University of Jordan
          </span>
        </div>
      )}
    </div>
  );
}
