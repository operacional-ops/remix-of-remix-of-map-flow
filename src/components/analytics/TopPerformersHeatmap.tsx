import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Image, Flame } from "lucide-react";

// ── Mock Data: Creative Winners ─────────────────────────────
interface Creative {
  id: string;
  name: string;
  thumbnail: string;
  ctr: number;
  roas: number;
}

const MOCK_CREATIVES: Creative[] = [
  { id: "1", name: "VSL Lithium v3 – Hook Dor", thumbnail: "", ctr: 4.2, roas: 4.8 },
  { id: "2", name: "Estático Oferta – Antes/Depois", thumbnail: "", ctr: 3.8, roas: 3.9 },
  { id: "3", name: "UGC Depoimento Maria", thumbnail: "", ctr: 3.5, roas: 3.5 },
  { id: "4", name: "Carrossel Benefícios 5x", thumbnail: "", ctr: 2.9, roas: 3.1 },
  { id: "5", name: "VSL Curto – Prova Social", thumbnail: "", ctr: 2.7, roas: 2.8 },
];

// ── Mock Data: Heatmap (7 days × 24 hours) ──────────────────
const DAYS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

function generateHeatmapData(): number[][] {
  // Structured mock — peaks afternoon/evening, low early morning
  return DAYS.map((_, dayIdx) => {
    return HOURS.map((hour) => {
      const base = Math.random() * 2;
      const peakBonus =
        hour >= 12 && hour <= 21
          ? 3 + Math.random() * 5
          : hour >= 8 && hour <= 11
          ? 1 + Math.random() * 3
          : 0;
      const weekendBonus = dayIdx >= 5 && hour >= 14 && hour <= 18 ? 3 : 0;
      return Math.round(base + peakBonus + weekendBonus);
    });
  });
}

const MOCK_HEATMAP = generateHeatmapData();

function getHeatmapColor(value: number, max: number): string {
  if (value === 0) return "hsl(215, 20%, 15%)";
  const intensity = value / max;
  if (intensity > 0.75) return "hsl(142, 71%, 35%)";
  if (intensity > 0.5) return "hsl(142, 60%, 28%)";
  if (intensity > 0.25) return "hsl(142, 50%, 22%)";
  return "hsl(142, 40%, 17%)";
}

interface TopPerformersHeatmapProps {
  creatives?: Creative[];
  heatmapData?: number[][];
}

export function TopPerformersHeatmap({ creatives, heatmapData }: TopPerformersHeatmapProps) {
  const crvs = creatives || MOCK_CREATIVES;
  const heat = heatmapData || MOCK_HEATMAP;

  const maxHeat = useMemo(() => Math.max(...heat.flat()), [heat]);

  return (
    <Card className="border-border/50">
      <Tabs defaultValue="creatives">
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            📊 Deep Analysis
          </CardTitle>
          <TabsList className="h-8">
            <TabsTrigger value="creatives" className="text-xs gap-1.5 px-3">
              <Flame className="h-3 w-3" />
              Creative Winners
            </TabsTrigger>
            <TabsTrigger value="heatmap" className="text-xs gap-1.5 px-3">
              <Image className="h-3 w-3" />
              Heatmap Horário
            </TabsTrigger>
          </TabsList>
        </CardHeader>

        {/* Tab A: Creative Winners */}
        <TabsContent value="creatives">
          <CardContent className="pt-0">
            <div className="space-y-2">
              {crvs.map((c, i) => (
                <div
                  key={c.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  {/* Rank */}
                  <span className={cn(
                    "text-sm font-bold w-6 text-center",
                    i === 0 ? "text-yellow-400" : i === 1 ? "text-gray-400" : i === 2 ? "text-amber-600" : "text-muted-foreground"
                  )}>
                    #{i + 1}
                  </span>

                  {/* Thumbnail placeholder */}
                  <div className="h-10 w-14 rounded bg-muted/60 flex items-center justify-center shrink-0">
                    <Image className="h-4 w-4 text-muted-foreground/50" />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{c.name}</p>
                    <div className="flex gap-3 mt-0.5">
                      <span className="text-[10px] text-muted-foreground">
                        CTR: <span className="text-foreground font-medium">{c.ctr}%</span>
                      </span>
                    </div>
                  </div>

                  {/* ROAS Badge */}
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-xs shrink-0",
                      c.roas >= 3
                        ? "border-emerald-500/30 text-emerald-400 bg-emerald-500/10"
                        : c.roas >= 2
                        ? "border-yellow-500/30 text-yellow-400 bg-yellow-500/10"
                        : "border-rose-500/30 text-rose-400 bg-rose-500/10"
                    )}
                  >
                    ROAS {c.roas.toFixed(1)}x
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </TabsContent>

        {/* Tab B: Hourly Heatmap */}
        <TabsContent value="heatmap">
          <CardContent className="pt-0">
            <div className="overflow-x-auto">
              {/* Hour labels */}
              <div className="flex mb-1 ml-10">
                {HOURS.filter((_, i) => i % 3 === 0).map((h) => (
                  <span
                    key={h}
                    className="text-[9px] text-muted-foreground/60"
                    style={{ width: `${(3 / 24) * 100}%` }}
                  >
                    {String(h).padStart(2, "0")}h
                  </span>
                ))}
              </div>

              {/* Grid */}
              <div className="space-y-[3px]">
                {DAYS.map((day, dayIdx) => (
                  <div key={day} className="flex items-center gap-2">
                    <span className="text-[10px] text-muted-foreground w-7 text-right shrink-0">
                      {day}
                    </span>
                    <div className="flex gap-[2px] flex-1">
                      {HOURS.map((hour) => {
                        const val = heat[dayIdx][hour];
                        return (
                          <div
                            key={hour}
                            className="flex-1 aspect-square rounded-[3px] min-w-[10px] transition-colors"
                            style={{ backgroundColor: getHeatmapColor(val, maxHeat) }}
                            title={`${day} ${String(hour).padStart(2, "0")}:00 — ${val} vendas`}
                          />
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {/* Legend */}
              <div className="flex items-center justify-end gap-1.5 mt-3">
                <span className="text-[9px] text-muted-foreground/60">Menos</span>
                {[0, 0.25, 0.5, 0.75, 1].map((intensity) => (
                  <div
                    key={intensity}
                    className="h-3 w-3 rounded-[2px]"
                    style={{
                      backgroundColor: getHeatmapColor(
                        Math.round(intensity * maxHeat),
                        maxHeat
                      ),
                    }}
                  />
                ))}
                <span className="text-[9px] text-muted-foreground/60">Mais</span>
              </div>
            </div>
          </CardContent>
        </TabsContent>
      </Tabs>
    </Card>
  );
}
