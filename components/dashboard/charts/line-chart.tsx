"use client"

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
}

const chartConfig = {
  value: {
    label: "Valor",
    color: "#238af0",
  },
} satisfies ChartConfig

export function LineChartComponent({
  data,
  title,
  description,
  valueKey = "value",
  valueFormatter,
}: LineChartProps) {
  const chartData = data.map((item) => ({
    label: item.label,
    [valueKey]: item.value,
  }))

  return (
    <ChartContainer id="line-chart" config={chartConfig} className="h-64">
      <LineChart
        data={chartData}
        margin={{ left: 12, right: 12, top: 12, bottom: 12 }}
      >
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
        />
        <ChartTooltip
          cursor={false}
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
          type="linear"
          stroke="var(--color-value)"
          strokeWidth={2}
          dot={{ fill: "var(--color-value)", r: 4 }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ChartContainer>
  )
}

