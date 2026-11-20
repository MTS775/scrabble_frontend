import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Auth as AuthService } from '../../core/services/auth';

@Component({
  selector: 'app-auth',
  imports: [FormsModule],
  templateUrl: './auth.html',
  styleUrl: './auth.css',
})
export class Auth {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly mode = signal<'login' | 'register'>('login');
  readonly error = signal('');
  username = '';
  email = '';
  password = '';

  setMode(mode: 'login' | 'register'): void {
    this.mode.set(mode);
    this.error.set('');
  }

  submit(): void {
    const email = this.email.trim();
    const password = this.password;

    if (!email || !password || (this.mode() === 'register' && !this.username.trim())) {
      this.error.set('Veuillez remplir tous les champs requis.');
      return;
    }

    const username = this.username.trim() || email.split('@')[0];
    this.auth.login({
      id: crypto.randomUUID(),
      username,
      email,
      provider: 'password',
    });
    this.router.navigate(['/lobby']);
  }

  loginWithGoogle(): void {
    this.auth.login({
      id: crypto.randomUUID(),
      username: 'th professor',
      email: 'th.professor@gmail.com',
      provider: 'google',
    });
    this.router.navigate(['/lobby']);
  }
}
