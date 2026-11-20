import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Auth } from '../../core/services/auth';

@Component({
  selector: 'app-settings',
  imports: [],
  templateUrl: './settings.html',
  styleUrl: './settings.css',
})
export class Settings {
  private readonly router = inject(Router);
  private readonly auth = inject(Auth);

  readonly user = this.auth.user;
  readonly livePoints = signal(true);
  readonly notifications = signal(true);

  backToLobby(): void {
    this.router.navigate(['/lobby']);
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
