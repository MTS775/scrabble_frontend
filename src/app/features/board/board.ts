import { NgClass } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Auth } from '../../core/services/auth';
import { OfficialScrabble } from '../../core/services/official-scrabble';
import { BoardCell, BoardTile, Player } from '../../core/models/game.models';

@Component({
  selector: 'app-board',
  imports: [NgClass],
  templateUrl: './board.html',
  styleUrl: './board.css',
})
export class Board {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly auth = inject(Auth);
  readonly official = inject(OfficialScrabble);

  readonly board = signal<BoardCell[][]>(this.official.createBoard());
  readonly bag = signal<BoardTile[]>(this.official.createBag());
  readonly players = signal<Player[]>([
    { name: this.auth.user()?.username || 'Joueur 1', score: 0, rack: [] },
    { name: 'Joueur 2', score: 0, rack: [] },
  ]);
  readonly currentPlayerIndex = signal(0);
  readonly selectedRackIndex = signal<number | null>(null);
  readonly lastMove = signal('Nouvelle partie — Grille officielle 15×15');
  readonly jokerPlacement = signal<{ row: number; col: number; rackIndex: number; tile: BoardTile } | null>(null);
  readonly exchangeOpen = signal(false);
  readonly exchangeIndices = signal<Set<number>>(new Set());

  readonly alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

  constructor() {
    const first = this.official.draw(this.bag(), 7);
    const second = this.official.draw(this.bag(), 7);
    this.players.update(players => {
      players[0].rack = [...first, ...Array<null>(7 - first.length).fill(null)];
      players[1].rack = [...second, ...Array<null>(7 - second.length).fill(null)];
      return [...players];
    });
  }

  get activePlayer(): Player {
    return this.players()[this.currentPlayerIndex()];
  }

  get bagRemaining(): number {
    return this.bag().length;
  }

  get temporaryTiles(): number {
    return this.board().flat().filter(cell => cell.tile && !cell.tile.locked).length;
  }

  get canExchange(): boolean {
    return this.activePlayer.rack.some(tile => tile !== null);
  }

  bonusLabel(bonus: BoardCell['bonus']): string {
    switch (bonus) {
      case 'MT': return 'MT';
      case 'MD': return 'MD';
      case 'LT': return 'LT';
      case 'LD': return 'LD';
      case 'STAR': return '★';
      default: return '';
    }
  }

  bonusClass(bonus: BoardCell['bonus']): string {
    return bonus === 'NORMAL' ? 'cell-normal' : `cell-${bonus.toLowerCase()}`;
  }

  selectRackTile(index: number): void {
    if (!this.activePlayer.rack[index]) return;
    this.selectedRackIndex.set(this.selectedRackIndex() === index ? null : index);
  }

  dragRackTile(event: DragEvent, rackIndex: number): void {
    if (!this.activePlayer.rack[rackIndex]) {
      event.preventDefault();
      return;
    }
    this.selectedRackIndex.set(rackIndex);
    event.dataTransfer?.setData('application/x-lexinorme-rack', String(rackIndex));
    event.dataTransfer?.setData('text/plain', String(rackIndex));
    if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move';
  }

  dragBoardTile(event: DragEvent, row: number, col: number): void {
    const tile = this.board()[row][col].tile;
    if (!tile || tile.locked) {
      event.preventDefault();
      return;
    }
    event.dataTransfer?.setData('application/x-lexinorme-board', JSON.stringify({ row, col }));
    event.dataTransfer?.setData('text/plain', `board:${row}:${col}`);
    if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move';
  }

  allowDrop(event: DragEvent): void {
    event.preventDefault();
    if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
  }

  dropTile(event: DragEvent, row: number, col: number): void {
    event.preventDefault();
    const destination = this.board()[row][col];
    if (destination.tile?.locked) return;

    const rackIndexText = event.dataTransfer?.getData('application/x-lexinorme-rack');
    if (rackIndexText !== '') {
      this.placeRackTileOnBoard(Number(rackIndexText), row, col);
      return;
    }

    const boardPayload = event.dataTransfer?.getData('application/x-lexinorme-board');
    if (boardPayload) {
      const source = JSON.parse(boardPayload) as { row: number; col: number };
      this.moveBoardTile(source.row, source.col, row, col);
    }
  }

  dropOnRack(event: DragEvent, targetSlotIndex: number): void {
    event.preventDefault();
    const boardPayload = event.dataTransfer?.getData('application/x-lexinorme-board');
    if (boardPayload) {
      const source = JSON.parse(boardPayload) as { row: number; col: number };
      this.returnTileToRack(source.row, source.col, targetSlotIndex);
    }
  }

  private placeRackTileOnBoard(rackIndex: number, row: number, col: number): void {
    if (!Number.isInteger(rackIndex) || rackIndex < 0) return;
    if (this.board()[row][col].tile) return;

    const tile = this.activePlayer.rack[rackIndex];
    if (!tile) return;
    this.activePlayer.rack[rackIndex] = null;
    this.selectedRackIndex.set(null);

    if (tile.isJoker) {
      this.jokerPlacement.set({ row, col, rackIndex, tile });
      return;
    }
    this.placeTile(row, col, { ...tile, locked: false });
  }

  private moveBoardTile(fromRow: number, fromCol: number, toRow: number, toCol: number): void {
    if (fromRow === toRow && fromCol === toCol) return;
    const source = this.board()[fromRow][fromCol];
    if (!source.tile || source.tile.locked) return;
    if (this.board()[toRow][toCol].tile) return;

    const tile = source.tile;
    this.board.update(board => {
      board[fromRow][fromCol].tile = null;
      board[toRow][toCol].tile = tile;
      return [...board];
    });
  }

  cellClick(row: number, col: number): void {
    const cell = this.board()[row][col];

    if (cell.tile) {
      if (cell.tile.locked) return;
      this.returnTileToRack(row, col);
      return;
    }

    const rackIndex = this.selectedRackIndex();
    if (rackIndex === null) return;
    const tile = this.activePlayer.rack[rackIndex];
    if (!tile) return;

    this.activePlayer.rack[rackIndex] = null;
    this.selectedRackIndex.set(null);

    if (tile.isJoker) {
      this.jokerPlacement.set({ row, col, rackIndex, tile });
      return;
    }

    this.placeTile(row, col, { ...tile, locked: false });
  }

  private placeTile(row: number, col: number, tile: BoardTile): void {
    this.board.update(board => {
      board[row][col].tile = tile;
      return [...board];
    });
  }

  private returnTileToRack(row: number, col: number, targetSlotIndex?: number): void {
    const tile = this.board()[row][col].tile;
    if (!tile || tile.locked) return;

    const rack = this.activePlayer.rack;
    let target = targetSlotIndex;
    if (target === undefined || rack[target] !== null) {
      target = rack.findIndex(slot => slot === null);
    }
    if (target === undefined || target < 0) return;

    rack[target] = tile.isJoker ? { ...tile, assignedLetter: null } : tile;

    this.board.update(board => {
      board[row][col].tile = null;
      return [...board];
    });
  }

  chooseJokerLetter(letter: string): void {
    const pending = this.jokerPlacement();
    if (!pending) return;
    this.placeTile(pending.row, pending.col, {
      ...pending.tile,
      assignedLetter: letter,
      locked: false,
    });
    this.jokerPlacement.set(null);
  }

  cancelJoker(): void {
    const pending = this.jokerPlacement();
    if (pending) {
      this.activePlayer.rack[pending.rackIndex] = pending.tile;
    }
    this.jokerPlacement.set(null);
  }

  primaryAction(): void {
    if (this.temporaryTiles === 0) {
      this.passTurn();
    } else {
      this.playTiles();
    }
  }

  private playTiles(): void {
    let total = 0;
    let wordMultiplier = 1;

    this.board().forEach((row, r) => row.forEach((cell, c) => {
      if (!cell.tile || cell.tile.locked) return;
      let points = cell.tile.isJoker ? 0 : cell.tile.points;
      if (cell.bonus === 'LD') points *= 2;
      if (cell.bonus === 'LT') points *= 3;
      if (cell.bonus === 'MD' || cell.bonus === 'STAR') wordMultiplier *= 2;
      if (cell.bonus === 'MT') wordMultiplier *= 3;
      total += points;
    }));

    total *= wordMultiplier;
    if (this.temporaryTiles === 7) total += 50;

    const player = this.activePlayer;
    player.score += total;

    this.board.update(board => {
      board.forEach(row => row.forEach(cell => {
        if (cell.tile && !cell.tile.locked) cell.tile = { ...cell.tile, locked: true };
      }));
      return [...board];
    });

    this.lastMove.set(`${player.name} a joué pour ${total} point${total > 1 ? 's' : ''}`);
    this.fillRack();
    this.selectedRackIndex.set(null);
    this.advanceTurn();
  }

  secondaryAction(): void {
    if (this.temporaryTiles > 0) {
      this.clearTemporaryTiles();
    } else {
      this.shuffleRack();
    }
  }

  private clearTemporaryTiles(): void {
    this.board.update(board => {
      board.forEach(row => row.forEach(cell => {
        if (cell.tile && !cell.tile.locked) {
          const empty = this.activePlayer.rack.findIndex(slot => slot === null);
          if (empty >= 0) {
            this.activePlayer.rack[empty] = cell.tile.isJoker
              ? { ...cell.tile, assignedLetter: null }
              : cell.tile;
          }
          cell.tile = null;
        }
      }));
      return [...board];
    });
    this.selectedRackIndex.set(null);
  }

  shuffleRack(): void {
    const tiles = this.activePlayer.rack.filter((tile): tile is BoardTile => tile !== null);
    this.activePlayer.rack = [
      ...this.official.shuffle(tiles),
      ...Array<null>(7 - tiles.length).fill(null),
    ];
    this.selectedRackIndex.set(null);
  }

  passTurn(): void {
    this.clearTemporaryTiles();
    this.lastMove.set(`${this.activePlayer.name} a passé son tour`);
    this.selectedRackIndex.set(null);
    this.advanceTurn();
  }

  private fillRack(): void {
    const player = this.activePlayer;
    const missing = player.rack.filter(tile => tile === null).length;
    const drawn = this.official.draw(this.bag(), missing);
    let drawIndex = 0;
    player.rack = player.rack.map(slot => slot ?? drawn[drawIndex++] ?? null);
  }

  private advanceTurn(): void {
    this.currentPlayerIndex.set((this.currentPlayerIndex() + 1) % 2);
  }

  toggleExchange(): void {
    this.exchangeOpen.set(!this.exchangeOpen());
    if (!this.exchangeOpen()) this.exchangeIndices.set(new Set());
  }

  toggleExchangeTile(index: number): void {
    if (!this.activePlayer.rack[index]) return;
    const selected = new Set(this.exchangeIndices());
    if (selected.has(index)) selected.delete(index);
    else selected.add(index);
    this.exchangeIndices.set(selected);
  }

  confirmExchange(): void {
    const indices = [...this.exchangeIndices()].sort((a, b) => b - a);
    if (indices.length === 0) {
      this.toggleExchange();
      return;
    }

    const returned: BoardTile[] = [];
    indices.forEach(index => {
      const tile = this.activePlayer.rack[index];
      if (tile) returned.push(tile);
      this.activePlayer.rack[index] = null;
    });

    this.bag.update(bag => {
      bag.push(...returned);
      return this.official.shuffle(bag);
    });

    const missing = indices.length;
    const replacement = this.official.draw(this.bag(), missing);
    replacement.forEach((tile, i) => {
      const index = indices[i];
      this.activePlayer.rack[index] = tile;
    });

    this.lastMove.set(`${this.activePlayer.name} a échangé ${missing} tuile${missing > 1 ? 's' : ''}`);
    this.exchangeIndices.set(new Set());
    this.exchangeOpen.set(false);
    this.advanceTurn();
  }

  openChat(): void {
    const matchId = this.route.snapshot.paramMap.get('matchId') || '1';
    this.router.navigate(['/game', matchId, 'chat']);
  }

  backToLobby(): void {
    this.router.navigate(['/lobby']);
  }
}
