import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/auth').then(m => m.Auth),
  },
  {
    path: 'lobby',
    loadComponent: () => import('./features/lobby/lobby').then(m => m.Lobby),
  },
  {
    path: 'game/:matchId',
    loadComponent: () => import('./features/board/board').then(m => m.Board),
  },
  {
    path: 'game/:matchId/chat',
    loadComponent: () => import('./features/chat/chat').then(m => m.Chat),
  },
  {
    path: 'settings',
    loadComponent: () => import('./features/settings/settings').then(m => m.Settings),
  },
  { path: '**', redirectTo: 'login' },
];
