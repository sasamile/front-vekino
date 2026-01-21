"use client"

import { useId } from "react"
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"

interface BarChartData {
  label: string
  value: number
}

interface BarChartProps {
  data: BarChartData[]
  title: string
  description?: string
  valueKey?: string
  hideHeader?: boolean
}

const chartConfig = {
  value: {
    label: "Valor",
    color: "var(--primary)",
  },
} satisfies ChartConfig

export function BarChartComponent({
  data,
  title,
  description,
  valueKey = "value",
  hideHeader = false,
}: BarChartProps) {
  const gradientId = useId()

  const chartData = data.map((item) => ({
    label: item.label,
    [valueKey]: item.value,
  }))

  return (
    <div className="rounded-2xl border bg-card/80 p-4 shadow-sm backdrop-blur">
      {!hideHeader && (
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-foreground">{title}</p>
            {description ? (
              <p className="text-xs text-muted-foreground">{description}</p>
            ) : null}
          </div>
          <span className="rounded-full bg-primary/10 px-3 py-1 text-[11px] font-medium text-primary">
            Barras
          </span>
        </div>
      )}

      <ChartContainer
        id="bar-chart"
        config={chartConfig}
        className="h-64 w-full px-2 pb-2"
      >
        <BarChart data={chartData} margin={{ left: 8, right: 8 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-value)" stopOpacity={0.85} />
              <stop offset="100%" stopColor="var(--color-value)" stopOpacity={0.35} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} strokeDasharray="4 4" strokeOpacity={0.35} />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tickMargin={10}
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
          />
          <ChartTooltip
            cursor={{ fill: "hsl(var(--muted)/0.3)" }}
            content={<ChartTooltipContent hideLabel />}
          />
          <Bar
            dataKey={valueKey}
            fill={`url(#${gradientId})`}
            radius={[8, 8, 6, 6]}
          />
        </BarChart>
      </ChartContainer>
    </div>
  )
}

