import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Mock funnel data — structured for easy API replacement
const MOCK_FUNNEL: FunnelStage[] = [
  { stage: "Impressões", value: 584200, color: "hsl(221, 83%, 53%)" },
  { stage: "Cliques", value: 18740, color: "hsl(280, 70%, 55%)" },
  { stage: "Checkout", value: 2340, color: "hsl(43, 96%, 56%)" },
  { stage: "Compras", value: 412, color: "hsl(142, 71%, 45%)" },
];

interface FunnelStage {
  stage: string;
  value: number;
  color: string;
}

interface SalesFunnelChartProps {
  data?: FunnelStage[];
}

export function SalesFunnelChart({ data }: SalesFunnelChartProps) {
  const funnel = data || MOCK_FUNNEL;

  const enriched = useMemo(() => {
    return funnel.map((item, i) => {
      const prev = i > 0 ? funnel[i - 1].value : item.value;
      const dropOff = prev > 0 ? ((item.value / prev) * 100).toFixed(1) : "100";
      return {
        ...item,
        dropOff: `${dropOff}%`,
        label: `${(item.value / 1000).toFixed(item.value >= 1000 ? 1 : 0)}${item.value >= 1000 ? "k" : ""}`,
      };
    });
  }, [funnel]);

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          🔻 Funil de Vendas
        </CardTitle>
        <p className="text-xs text-muted-foreground/70">
          Visualize onde os clientes estão sendo perdidos no processo de compra
        </p>
      </CardHeader>
      <CardContent className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={enriched}
            layout="vertical"
            margin={{ top: 5, right: 60, left: 10, bottom: 5 }}
          >
            <XAxis type="number" hide />
            <YAxis
              type="category"
              dataKey="stage"
              tick={{ fontSize: 12, fill: "hsl(215, 20%, 65%)" }}
              axisLine={false}
              tickLine={false}
              width={90}
            />
            <Tooltip
              contentStyle={{
                background: "hsl(215, 20%, 16%)",
                border: "1px solid hsl(215, 20%, 20%)",
                borderRadius: "8px",
                fontSize: 12,
                color: "hsl(210, 40%, 96%)",
              }}
              formatter={(value: number, _name: string, props: any) => [
                `${value.toLocaleString("pt-BR")} (${props.payload.dropOff})`,
                "Volume",
              ]}
            />
            <Bar dataKey="value" radius={[0, 8, 8, 0]} barSize={36}>
              {enriched.map((entry, index) => (
                <Cell key={index} fill={entry.color} fillOpacity={0.85} />
              ))}
              <LabelList
                dataKey="dropOff"
                position="right"
                style={{ fontSize: 11, fill: "hsl(215, 20%, 65%)" }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
