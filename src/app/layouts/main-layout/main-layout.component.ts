import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';
import { TopbarComponent } from '../../shared/components/topbar/topbar.component';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, SidebarComponent, TopbarComponent],
  template: `
    <div class="app-layout">
      <!-- Left Sidebar -->
      <app-sidebar
        [isOpen]="sidebarOpen"
        (close)="sidebarOpen = false"
      ></app-sidebar>

      <!-- Main Shell Content Area -->
      <div class="app-main-wrapper">
        <app-topbar (toggleSidebar)="sidebarOpen = !sidebarOpen"></app-topbar>

        <main class="app-content-body">
          <router-outlet></router-outlet>
        </main>
      </div>
    </div>
  `,
  styles: [
    `
      .app-layout {
        display: flex;
        min-height: 100vh;
        background-color: var(--cfh-bg);
      }

      .app-main-wrapper {
        flex: 1;
        margin-left: var(--cfh-sidebar-width);
        display: flex;
        flex-direction: column;
        min-width: 0;
        transition: margin-left 0.25s ease;
      }

      .app-content-body {
        flex: 1;
        padding: 24px 32px;
      }

      @media (max-width: 991px) {
        .app-main-wrapper {
          margin-left: 0;
        }

        .app-content-body {
          padding: 16px;
        }
      }
    `,
  ],
})
export class MainLayoutComponent {
  sidebarOpen = false;
}
