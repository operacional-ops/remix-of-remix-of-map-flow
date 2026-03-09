import { useTheme } from 'next-themes';
import logoImpactizeSpecial from '@/assets/logo-impactize-special.png';
import logoImpactizePreto from '@/assets/logo-impactize-preto.png';

interface ThemeLogoProps {
  className?: string;
  forceDark?: boolean;
}

export function ThemeLogo({ className = 'h-16 w-16', forceDark = false }: ThemeLogoProps) {
  const { resolvedTheme } = useTheme();
  // Modo escuro → LOGO Monocromático Special (roxo)
  // Modo claro  → LOGO Monocromático Preto (preto)
  const logo = forceDark || resolvedTheme === 'dark' ? logoImpactizeSpecial : logoImpactizePreto;

  return <img src={logo} alt="Impactize" className={className} />;
}
