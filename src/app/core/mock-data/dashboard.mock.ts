import { DashboardStatistics } from '../models/dashboard.model';

export const MOCK_DASHBOARD_STATS: DashboardStatistics = {
  totalFiles: 8,
  totalUsers: 7,
  successfulFileViews: 142,
  recentSecurityEvents: 3,
  filesTrend: '+2 this month',
  usersTrend: '+1 this month',
  viewsTrend: '+18% vs last week',
  securityTrend: '2 failed passwords logged',
};
