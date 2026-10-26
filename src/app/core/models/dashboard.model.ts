export interface DashboardStatistics {
  totalFiles: number;
  totalUsers: number;
  successfulFileViews: number;
  recentSecurityEvents: number;
  filesTrend?: string;
  usersTrend?: string;
  viewsTrend?: string;
  securityTrend?: string;
}
