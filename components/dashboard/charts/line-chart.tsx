"use client"

import { useId } from "react"
import { CartesianGrid, Line, LineChart, XAxis } from "recharts"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"

interface LineChartData {
  label: string
  value: number
}

interface LineChartProps {
  data: LineChartData[]
  title: string
  description?: string
  valueKey?: string
  valueFormatter?: (value: number) => string
  hideHeader?: boolean
}

const chartConfig = {
  value: {
    label: "Valor",
    color: "var(--primary)",
  },
} satisfies ChartConfig

export function LineChartComponent({
  data,
  title,
  description,
  valueKey = "value",
  valueFormatter,
  hideHeader = false,
}: LineChartProps) {
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
            Línea
          </span>
        </div>
      )}

      <ChartContainer
        id="line-chart"
        config={chartConfig}
        className="h-64 w-full px-2 pb-2"
      >
        <LineChart
          data={chartData}
          margin={{ left: 8, right: 8, top: 12, bottom: 12 }}
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-value)" stopOpacity={0.35} />
              <stop offset="100%" stopColor="var(--color-value)" stopOpacity={0.02} />
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
            cursor={{ stroke: "var(--border)", strokeWidth: 1 }}
            content={
              <ChartTooltipContent
                hideLabel
                formatter={(value) => {
                  if (valueFormatter) {
                    return valueFormatter(Number(value))
                  }
                  return String(value)
                }}
              />
            }
          />
          <Line
            dataKey={valueKey}
            type="monotone"
            stroke="var(--color-value)"
            strokeWidth={2.5}
            dot={{ fill: "var(--color-value)", r: 4 }}
            activeDot={{ r: 6, strokeWidth: 2, stroke: "var(--card)" }}
            fill={`url(#${gradientId})`}
          />
        </LineChart>
      </ChartContainer>
    </div>
  )
}

