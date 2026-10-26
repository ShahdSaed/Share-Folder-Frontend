import { Routes } from '@angular/router';
import { authGuard, adminGuard } from './guards/auth.guard';

export const routes: Routes = [
  // Redirect root to dashboard
  {
    path: '',
    redirectTo: '/dashboard',
    pathMatch: 'full',
  },
  // Public route - Login
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login/login.component').then((m) => m.LoginComponent),
    title: 'Sign In — Company File Hub',
  },
  // Authenticated routes - inside main layout
  {
    path: '',
    loadComponent: () =>
      import('./layouts/main-layout/main-layout.component').then((m) => m.MainLayoutComponent),
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
        title: 'Dashboard — Company File Hub',
      },
      {
        path: 'shared-files',
        loadComponent: () =>
          import('./features/files/shared-files/shared-files.component').then(
            (m) => m.SharedFilesComponent
          ),
        title: 'Shared Files — Company File Hub',
      },
      {
        path: 'document-viewer/:id',
        loadComponent: () =>
          import('./features/document-viewer/document-viewer.component').then(
            (m) => m.DocumentViewerComponent
          ),
        title: 'Document Viewer — Company File Hub',
      },
      // Admin-only routes
      {
        path: 'admin',
        canActivate: [adminGuard],
        children: [
          {
            path: 'manage-files',
            loadComponent: () =>
              import('./features/admin/manage-files/manage-files.component').then(
                (m) => m.ManageFilesComponent
              ),
            title: 'Manage Files — Company File Hub',
          },
          {
            path: 'manage-users',
            loadComponent: () =>
              import('./features/admin/manage-users/manage-users.component').then(
                (m) => m.ManageUsersComponent
              ),
            title: 'Manage Users — Company File Hub',
          },
          {
            path: 'activity-logs',
            loadComponent: () =>
              import('./features/admin/activity-logs/activity-logs.component').then(
                (m) => m.ActivityLogsComponent
              ),
            title: 'Activity Logs — Company File Hub',
          },
          {
            path: '',
            redirectTo: 'manage-files',
            pathMatch: 'full',
          },
        ],
      },
    ],
  },
  // Fallback
  {
    path: '**',
    redirectTo: '/dashboard',
  },
];
