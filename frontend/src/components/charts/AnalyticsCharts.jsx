import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { formatCurrency } from '../../utils/formatters';

export const RevenueAreaChart = ({ data = [] }) => (
  <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
    <div className="mb-4">
      <h3 className="text-base font-bold text-slate-900">Monthly Gross Revenue & Commission (INR)</h3>
      <p className="text-xs text-slate-500">Gross GMV vs 15% Platform SaaS Commission</p>
    </div>
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="revGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#2563EB" stopOpacity={0.35} />
              <stop offset="95%" stopColor="#2563EB" stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id="commGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#16A34A" stopOpacity={0.35} />
              <stop offset="95%" stopColor="#16A34A" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
          <XAxis dataKey="month" stroke="#64748B" fontSize={12} />
          <YAxis stroke="#64748B" fontSize={12} />
          <Tooltip formatter={(val) => formatCurrency(val)} />
          <Legend />
          <Area
            type="monotone"
            dataKey="revenue"
            name="Gross Revenue (₹)"
            stroke="#2563EB"
            strokeWidth={2.5}
            fill="url(#revGradient)"
          />
          <Area
            type="monotone"
            dataKey="commission"
            name="Platform Commission (15%)"
            stroke="#16A34A"
            strokeWidth={2.5}
            fill="url(#commGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  </div>
);

export const BookingsTrendBarChart = ({ data = [] }) => (
  <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
    <div className="mb-4">
      <h3 className="text-base font-bold text-slate-900">Monthly Booking Volume Trends</h3>
      <p className="text-xs text-slate-500">Completed & confirmed service appointments per month</p>
    </div>
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
          <XAxis dataKey="month" stroke="#64748B" fontSize={12} />
          <YAxis stroke="#64748B" fontSize={12} />
          <Tooltip />
          <Legend />
          <Bar dataKey="bookings" name="Total Bookings" fill="#6366F1" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  </div>
);

export const BookingStatusPieChart = ({ data = [] }) => (
  <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
    <div className="mb-4">
      <h3 className="text-base font-bold text-slate-900">Booking Status Distribution</h3>
      <p className="text-xs text-slate-500">Platform-wide SLA fulfillment ratio</p>
    </div>
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={90}
            paddingAngle={3}
          >
            {data.map((entry, idx) => (
              <Cell key={`cell-${idx}`} fill={entry.color || '#2563EB'} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  </div>
);

export const CustomerGrowthLineChart = ({ data = [] }) => (
  <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
    <div className="mb-4">
      <h3 className="text-base font-bold text-slate-900">New Customer Acquisition Growth</h3>
      <p className="text-xs text-slate-500">Monthly verified household signups</p>
    </div>
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
          <XAxis dataKey="month" stroke="#64748B" fontSize={12} />
          <YAxis stroke="#64748B" fontSize={12} />
          <Tooltip />
          <Legend />
          <Line
            type="monotone"
            dataKey="customers"
            name="New Customers"
            stroke="#F59E0B"
            strokeWidth={3}
            dot={{ r: 5, fill: '#F59E0B' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  </div>
);

export const PopularCategoriesBarChart = ({ data = [] }) => (
  <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
    <div className="mb-4">
      <h3 className="text-base font-bold text-slate-900">Demand by Service Category</h3>
      <p className="text-xs text-slate-500">Top performing home service verticals</p>
    </div>
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
          <XAxis type="number" stroke="#64748B" fontSize={12} />
          <YAxis dataKey="category" type="category" stroke="#64748B" fontSize={11} width={100} />
          <Tooltip />
          <Bar dataKey="bookings" name="Bookings" fill="#2563EB" radius={[0, 8, 8, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  </div>
);
