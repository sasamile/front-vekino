"use client"

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
}

const chartConfig = {
  value: {
    label: "Valor",
    color: "#238af0",
  },
} satisfies ChartConfig

export function BarChartComponent({
  data,
  title,
  description,
  valueKey = "value",
}: BarChartProps) {
  const chartData = data.map((item) => ({
    label: item.label,
    [valueKey]: item.value,
  }))

  return (
    <ChartContainer id="bar-chart" config={chartConfig} className="h-64">
      <BarChart data={chartData} margin={{ left: 12, right: 12 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
        />
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent hideLabel />}
        />
        <Bar
          dataKey={valueKey}
          fill="var(--color-value)"
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ChartContainer>
  )
}

