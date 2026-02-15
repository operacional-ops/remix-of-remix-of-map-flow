import { useTheme } from 'next-themes';
import logoDrxGrey from '@/assets/logo-drx-grey.png';
import logoDrxWhite from '@/assets/logo-drx-white.png';

interface ThemeLogoProps {
  className?: string;
  forceDark?: boolean;
}

export function ThemeLogo({ className = 'h-16 w-16', forceDark = false }: ThemeLogoProps) {
  const { resolvedTheme } = useTheme();
  const logo = forceDark || resolvedTheme === 'dark' ? logoDrxWhite : logoDrxGrey;

  return <img src={logo} alt="DRX Central" className={className} />;
}
