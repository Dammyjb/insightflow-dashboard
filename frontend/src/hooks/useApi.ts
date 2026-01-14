import { useState, useEffect } from 'react';

interface JourneyMetrics {
  totalSessions: number;
  avgSessionDuration: number;
  churnRate: number;
  dropOffPoints: Array<{
    page: string;
    dropOffCount: number;
    dropOffRate: number;
  }>;
  activityBreakdown: Array<{
    activity: string;
    count: number;
    percentage: number;
  }>;
  timePerActivity: Array<{
    activity: string;
    avgDuration: number;
    totalTime: number;
  }>;
}

interface ConversionMetrics {
  bounceRate: number;
  overallConversionRate: number;
  funnelSteps: Array<{
    step: string;
    stepOrder: number;
    entered: number;
    completed: number;
    dropOffRate: number;
  }>;
  dailyConversions: Array<{
    date: string;
    visitors: number;
    conversions: number;
    rate: number;
  }>;
  revenueMetrics: {
    totalRevenue: number;
    avgOrderValue: number;
    conversionValue: number;
  };
}

interface UseApiResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

// Sample data for development/demo when API is unavailable
const SAMPLE_JOURNEY_METRICS: JourneyMetrics = {
  totalSessions: 1247,
  avgSessionDuration: 432,
  churnRate: 23,
  dropOffPoints: [
    { page: '/checkout', dropOffCount: 145, dropOffRate: 18.5 },
    { page: '/cart', dropOffCount: 98, dropOffRate: 12.3 },
    { page: '/signup', dropOffCount: 76, dropOffRate: 9.8 },
    { page: '/products', dropOffCount: 54, dropOffRate: 6.9 },
    { page: '/pricing', dropOffCount: 32, dropOffRate: 4.1 },
  ],
  activityBreakdown: [
    { activity: 'Homepage View', count: 1247, percentage: 28.5 },
    { activity: 'Product Browse', count: 892, percentage: 20.4 },
    { activity: 'Product Detail', count: 654, percentage: 15.0 },
    { activity: 'Add to Cart', count: 423, percentage: 9.7 },
    { activity: 'Checkout', count: 298, percentage: 6.8 },
  ],
  timePerActivity: [
    { activity: 'Checkout', avgDuration: 245, totalTime: 73010 },
    { activity: 'Product Detail', avgDuration: 186, totalTime: 121644 },
    { activity: 'Product Browse', avgDuration: 142, totalTime: 126664 },
    { activity: 'Search', avgDuration: 98, totalTime: 42336 },
    { activity: 'Homepage View', avgDuration: 45, totalTime: 56115 },
  ],
};

const SAMPLE_CONVERSION_METRICS: ConversionMetrics = {
  bounceRate: 24,
  overallConversionRate: 15,
  funnelSteps: [
    { step: 'Landing Page', stepOrder: 1, entered: 1000, completed: 750, dropOffRate: 25.0 },
    { step: 'Product View', stepOrder: 2, entered: 750, completed: 520, dropOffRate: 30.7 },
    { step: 'Add to Cart', stepOrder: 3, entered: 520, completed: 340, dropOffRate: 34.6 },
    { step: 'Begin Checkout', stepOrder: 4, entered: 340, completed: 210, dropOffRate: 38.2 },
    { step: 'Complete Purchase', stepOrder: 5, entered: 210, completed: 156, dropOffRate: 25.7 },
  ],
  dailyConversions: [
    { date: '2024-01-14', visitors: 89, conversions: 12, rate: 13 },
    { date: '2024-01-13', visitors: 102, conversions: 18, rate: 18 },
    { date: '2024-01-12', visitors: 95, conversions: 14, rate: 15 },
    { date: '2024-01-11', visitors: 78, conversions: 11, rate: 14 },
    { date: '2024-01-10', visitors: 112, conversions: 19, rate: 17 },
    { date: '2024-01-09', visitors: 88, conversions: 13, rate: 15 },
    { date: '2024-01-08', visitors: 94, conversions: 15, rate: 16 },
    { date: '2024-01-07', visitors: 67, conversions: 8, rate: 12 },
    { date: '2024-01-06', visitors: 73, conversions: 10, rate: 14 },
    { date: '2024-01-05', visitors: 85, conversions: 12, rate: 14 },
    { date: '2024-01-04', visitors: 98, conversions: 16, rate: 16 },
    { date: '2024-01-03', visitors: 105, conversions: 17, rate: 16 },
    { date: '2024-01-02', visitors: 91, conversions: 14, rate: 15 },
    { date: '2024-01-01', visitors: 56, conversions: 7, rate: 13 },
  ],
  revenueMetrics: {
    totalRevenue: 24567,
    avgOrderValue: 157,
    conversionValue: 24567,
  },
};

export function useJourneyMetrics(): UseApiResult<JourneyMetrics> {
  const [data, setData] = useState<JourneyMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/journey/metrics');
      if (!response.ok) throw new Error('Failed to fetch journey metrics');
      const result = await response.json();
      setData(result);
    } catch (err) {
      console.warn('Using sample data for journey metrics');
      // Use sample data when API is unavailable
      setData(SAMPLE_JOURNEY_METRICS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return { data, loading, error, refetch: fetchData };
}

export function useConversionMetrics(): UseApiResult<ConversionMetrics> {
  const [data, setData] = useState<ConversionMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/conversion/metrics');
      if (!response.ok) throw new Error('Failed to fetch conversion metrics');
      const result = await response.json();
      setData(result);
    } catch (err) {
      console.warn('Using sample data for conversion metrics');
      // Use sample data when API is unavailable
      setData(SAMPLE_CONVERSION_METRICS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return { data, loading, error, refetch: fetchData };
}
