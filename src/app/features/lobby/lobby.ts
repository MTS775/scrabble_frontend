import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Auth } from '../../core/services/auth';

interface MatchPreview {
  id: string;
  opponent: string;
  mode: 'SOLO' | '2P';
  status: 'active' | 'finished';
  myTurn: boolean;
  score: number;
  opponentScore: number;
  lastMove: string;
}

@Component({
  selector: 'app-lobby',
  imports: [],
  templateUrl: './lobby.html',
  styleUrl: './lobby.css',
})
export class Lobby {
  private readonly auth = inject(Auth);
  private readonly router = inject(Router);

  readonly user = this.auth.user;
  readonly showNewMatch = signal(false);
  readonly opponentName = signal('Joueur 2');
  readonly mode = signal<'SOLO' | '2P'>('2P');

  readonly matches = signal<MatchPreview[]>([
    { id: '1', opponent: 'Mathieu', mode: '2P', status: 'active', myTurn: true, score: 128, opponentScore: 96, lastMove: 'À toi de jouer' },
    { id: '2', opponent: 'Lexi Bot', mode: 'SOLO', status: 'active', myTurn: false, score: 74, opponentScore: 81, lastMove: 'Lexi Bot a joué' },
    { id: '3', opponent: 'Camille', mode: '2P', status: 'finished', myTurn: false, score: 312, opponentScore: 287, lastMove: 'Victoire — 312 à 287' },
  ]);

  initials(name: string): string {
    return name.trim().split(/\s+/).map(part => part[0]).join('').slice(0, 2).toUpperCase();
  }

  openSettings(): void {
    this.router.navigate(['/settings']);
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }

  openMatch(match: MatchPreview): void {
    this.router.navigate(['/game', match.id]);
  }

  openNewMatch(): void {
    this.showNewMatch.set(true);
  }

  closeNewMatch(): void {
    this.showNewMatch.set(false);
  }

  selectMode(mode: 'SOLO' | '2P'): void {
    this.mode.set(mode);
  }

  createMatch(): void {
    const match: MatchPreview = {
      id: crypto.randomUUID(),
      opponent: this.mode() === 'SOLO' ? 'Lexi Bot' : (this.opponentName().trim() || 'Joueur 2'),
      mode: this.mode(),
      status: 'active',
      myTurn: true,
      score: 0,
      opponentScore: 0,
      lastMove: 'Nouvelle partie',
    };

    this.matches.update(matches => [match, ...matches]);
    this.showNewMatch.set(false);
    this.router.navigate(['/game', match.id]);
  }
}
