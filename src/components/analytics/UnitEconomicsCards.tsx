import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { DollarSign, ShoppingCart, TrendingUp } from "lucide-react";

interface UnitEconomicsProps {
  cpa?: number;
  aov?: number;
  margin?: number;
}

// Mock defaults — swap for real props when API ready
const DEFAULTS = { cpa: 38.5, aov: 127.9, margin: 89.4 };

function formatCurrency(val: number) {
  return val.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function UnitEconomicsCards({ cpa, aov, margin }: UnitEconomicsProps) {
  const c = cpa ?? DEFAULTS.cpa;
  const a = aov ?? DEFAULTS.aov;
  const m = margin ?? DEFAULTS.margin;

  const cpaColor = c > 50 ? "text-rose-400" : c < 30 ? "text-emerald-400" : "text-yellow-400";
  const cpaBg = c > 50 ? "bg-rose-500/10" : c < 30 ? "bg-emerald-500/10" : "bg-yellow-500/10";

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* CPA */}
      <Card className="border-border/50">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-3">
            <div className={cn("p-2 rounded-lg", cpaBg)}>
              <DollarSign className={cn("h-4 w-4", cpaColor)} />
            </div>
            <span className={cn("text-xs font-medium px-2 py-1 rounded-full", cpaBg, cpaColor)}>
              {c > 50 ? "Alto" : c < 30 ? "Ótimo" : "Aceitável"}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">
            CPA (Custo por Aquisição)
          </p>
          <p className={cn("text-2xl font-bold", cpaColor)}>{formatCurrency(c)}</p>
          <p className="text-[10px] text-muted-foreground/60 mt-1">
            Custo médio para adquirir 1 cliente
          </p>
        </CardContent>
      </Card>

      {/* AOV / Ticket Médio */}
      <Card className="border-border/50">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <ShoppingCart className="h-4 w-4 text-primary" />
            </div>
          </div>
          <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">
            Ticket Médio (AOV)
          </p>
          <p className="text-2xl font-bold">{formatCurrency(a)}</p>
          <p className="text-[10px] text-muted-foreground/60 mt-1">
            Receita Total / Número de Vendas
          </p>
        </CardContent>
      </Card>

      {/* Margem de Contribuição — highlighted */}
      <Card className={cn(
        "border-border/50 relative overflow-hidden",
        m > 0
          ? "ring-1 ring-emerald-500/30 bg-emerald-500/5"
          : "ring-1 ring-rose-500/30 bg-rose-500/5"
      )}>
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-3">
            <div className={cn(
              "p-2 rounded-lg",
              m > 0 ? "bg-emerald-500/10" : "bg-rose-500/10"
            )}>
              <TrendingUp className={cn("h-4 w-4", m > 0 ? "text-emerald-400" : "text-rose-400")} />
            </div>
            <span className={cn(
              "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider",
              m > 0
                ? "bg-emerald-500/15 text-emerald-400"
                : "bg-rose-500/15 text-rose-400"
            )}>
              ⭐ Métrica Principal
            </span>
          </div>
          <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">
            Margem de Contribuição
          </p>
          <p className={cn("text-2xl font-bold", m > 0 ? "text-emerald-400" : "text-rose-400")}>
            {formatCurrency(m)}
          </p>
          <p className="text-[10px] text-muted-foreground/60 mt-1">
            Ticket Médio − CPA = dinheiro real no bolso
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
