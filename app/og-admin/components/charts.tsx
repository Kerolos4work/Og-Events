"use client";


import dynamic from 'next/dynamic';

// Import recharts components dynamically to avoid SSR issues
const BarChart = dynamic(() => import('recharts').then(mod => ({ default: mod.BarChart as any })), { ssr: false }) as React.ComponentType<any>;
const Bar = dynamic(() => import('recharts').then(mod => ({ default: mod.Bar as any })), { ssr: false }) as React.ComponentType<any>;
const XAxis = dynamic(() => import('recharts').then(mod => ({ default: mod.XAxis as any })), { ssr: false }) as React.ComponentType<any>;
const YAxis = dynamic(() => import('recharts').then(mod => ({ default: mod.YAxis as any })), { ssr: false }) as React.ComponentType<any>;
const CartesianGrid = dynamic(() => import('recharts').then(mod => ({ default: mod.CartesianGrid as any })), { ssr: false }) as React.ComponentType<any>;
const Tooltip = dynamic(() => import('recharts').then(mod => ({ default: mod.Tooltip as any })), { ssr: false }) as React.ComponentType<any>;
const Legend = dynamic(() => import('recharts').then(mod => ({ default: mod.Legend as any })), { ssr: false }) as React.ComponentType<any>;
const ResponsiveContainer = dynamic(() => import('recharts').then(mod => ({ default: mod.ResponsiveContainer as any })), { ssr: false }) as React.ComponentType<any>;
const PieChart = dynamic(() => import('recharts').then(mod => ({ default: mod.PieChart as any })), { ssr: false }) as React.ComponentType<any>;
const Pie = dynamic(() => import('recharts').then(mod => ({ default: mod.Pie as any })), { ssr: false }) as React.ComponentType<any>;
const Cell = dynamic(() => import('recharts').then(mod => ({ default: mod.Cell as any })), { ssr: false }) as React.ComponentType<any>;

// Colors for charts
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

interface RevenueChartProps {
  data: Array<{ month: string; revenue: number }>;
}

export function RevenueChart({ data }: RevenueChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="month" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="revenue" fill="#8884d8" />
      </BarChart>
    </ResponsiveContainer>
  );
}

interface CategoryChartProps {
  data: Array<{ name: string; value: number }>;
}

export function CategoryChart({ data }: CategoryChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percent }: { name: any; percent: any }) => `${name} ${(percent * 100).toFixed(0)}%`}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  );
}

interface SeatStatusChartProps {
  data: Array<{ name: string; value: number; fill: string }>;
}

export function SeatStatusChart({ data }: SeatStatusChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percent }: { name: any; percent: any }) => `${name} ${(percent * 100).toFixed(0)}%`}
          outerRadius={80}
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.fill} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}

interface BookingStatusChartProps {
  data: Array<{ name: string; value: number }>;
}

export function BookingStatusChart({ data }: BookingStatusChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="value" fill="#8884d8" />
      </BarChart>
    </ResponsiveContainer>
  );
}
