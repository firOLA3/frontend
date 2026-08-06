'use client';

import { Users, UserCheck, UserX, Clock, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { participantsApi } from '@/lib/api';
import { useEffect, useState } from 'react';
import { cn, formatRelativeTime } from '@/lib/utils';
import { Card } from './Card';

interface StatsCardsProps {
  onRefresh: () => void;
}

export function StatsCards({ onRefresh }: StatsCardsProps) {
  const [stats, setStats] = useState<{
    total: number;
    active: number;
    scanned: number;
    todayScanned: number;
    notScanned: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const response = await participantsApi.getStats();
      setStats(response.stats);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const statItems = [
    {
      label: 'Total Participants',
      value: stats?.total ?? 0,
      icon: Users,
      color: 'primary',
      trend: null,
    },
    {
      label: 'Active',
      value: stats?.active ?? 0,
      icon: UserCheck,
      color: 'success',
      trend: stats ? { value: stats.active, label: 'of total' } : null,
    },
    {
      label: 'Scanned',
      value: stats?.scanned ?? 0,
      icon: Clock,
      color: 'warning',
      trend: stats ? { value: stats.todayScanned, label: 'today' } : null,
    },
    {
      label: 'Not Scanned',
      value: stats?.notScanned ?? 0,
      icon: UserX,
      color: 'danger',
      trend: stats && stats.total > 0 
        ? { value: Math.round((stats.notScanned / stats.total) * 100), label: 'remaining' }
        : null,
    },
  ];

  const colorClasses = {
    primary: 'bg-primary-100 text-primary-600',
    success: 'bg-success-100 text-success-600',
    warning: 'bg-warning-100 text-warning-600',
    danger: 'bg-danger-100 text-danger-600',
  };

  const IconComponents = {
    primary: Users,
    success: UserCheck,
    warning: Clock,
    danger: UserX,
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {statItems.map((stat, index) => (
        <Card key={stat.label} className="p-6" animationDelay={index * 100}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">{stat.label}</p>
              {loading ? (
                <div className="mt-2 h-8 w-24 bg-gray-200 animate-pulse rounded" />
              ) : (
                <p className="mt-2 text-3xl font-bold text-gray-900">{stat.value.toLocaleString()}</p>
              )}
              {stat.trend && !loading && (
                <p className="mt-1 text-sm text-gray-500 flex items-center gap-1">
                  <span className="font-medium">{stat.trend.value.toLocaleString()}</span>
                  <span>{stat.trend.label}</span>
                </p>
              )}
            </div>
            <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center', colorClasses[stat.color as keyof typeof colorClasses])}>
              <stat.icon className="h-6 w-6" />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}