import { Routes } from '@angular/router';
import { authGuard, adminGuard, dashboardGuard } from './guards/auth.guard';

export const routes: Routes = [
  // Redirect root: Admin → dashboard, Viewer → shared-files (handled by dashboardGuard)
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
    title: 'Shared Folder - Sotaico Pest Control',
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
        canActivate: [dashboardGuard],
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
        title: 'Shared Folder - Sotaico Pest Control',
      },
      {
        path: 'shared-files',
        loadComponent: () =>
          import('./features/files/shared-files/shared-files.component').then(
            (m) => m.SharedFilesComponent
          ),
        title: 'Shared Folder - Sotaico Pest Control',
      },
      {
        path: 'document-viewer/:id',
        loadComponent: () =>
          import('./features/document-viewer/document-viewer.component').then(
            (m) => m.DocumentViewerComponent
          ),
        title: 'Shared Folder - Sotaico Pest Control',
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
            title: 'Shared Folder - Sotaico Pest Control',
          },
          {
            path: 'manage-users',
            loadComponent: () =>
              import('./features/admin/manage-users/manage-users.component').then(
                (m) => m.ManageUsersComponent
              ),
            title: 'Shared Folder - Sotaico Pest Control',
          },
          {
            path: 'activity-logs',
            loadComponent: () =>
              import('./features/admin/activity-logs/activity-logs.component').then(
                (m) => m.ActivityLogsComponent
              ),
            title: 'Shared Folder - Sotaico Pest Control',
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
