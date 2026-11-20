import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

interface ChatMessage {
  from: 'me' | 'opponent';
  text: string;
  time: string;
}

@Component({
  selector: 'app-chat',
  imports: [FormsModule],
  templateUrl: './chat.html',
  styleUrl: './chat.css',
})
export class Chat {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly opponent = 'Joueur 2';
  readonly messages = signal<ChatMessage[]>([
    { from: 'opponent', text: 'Bonne partie !', time: '09:12' },
  ]);
  draft = '';

  send(): void {
    const text = this.draft.trim();
    if (!text) return;

    this.messages.update(messages => [...messages, {
      from: 'me',
      text,
      time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
    }]);
    this.draft = '';
  }

  backToGame(): void {
    const matchId = this.route.snapshot.paramMap.get('matchId') || '1';
    this.router.navigate(['/game', matchId]);
  }
}
