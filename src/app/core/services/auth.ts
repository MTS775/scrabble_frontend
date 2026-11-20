import { Injectable, signal } from '@angular/core';

export interface LexiUser {
  id: string;
  username: string;
  email: string;
  provider: 'password' | 'google';
}

const SESSION_KEY = 'lexinorme15x15-user-v1';

@Injectable({ providedIn: 'root' })
export class Auth {
  readonly user = signal<LexiUser | null>(this.readSession());

  login(user: LexiUser): void {
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    this.user.set(user);
  }

  logout(): void {
    localStorage.removeItem(SESSION_KEY);
    this.user.set(null);
  }

  private readSession(): LexiUser | null {
    const stored = localStorage.getItem(SESSION_KEY);
    return stored ? JSON.parse(stored) as LexiUser : null;
  }
}
