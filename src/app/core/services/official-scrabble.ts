import { Injectable } from '@angular/core';
import { BoardCell, BoardTile, BonusType, TileDefinition } from '../models/game.models';

@Injectable({ providedIn: 'root' })
export class OfficialScrabble {
  readonly size = 15;

  readonly tileDefinitions: readonly TileDefinition[] = [
    { letter: '?', points: 0, count: 2 },
    { letter: 'E', points: 1, count: 15 },
    { letter: 'A', points: 1, count: 9 },
    { letter: 'I', points: 1, count: 8 },
    { letter: 'N', points: 1, count: 6 },
    { letter: 'O', points: 1, count: 6 },
    { letter: 'R', points: 1, count: 6 },
    { letter: 'S', points: 1, count: 6 },
    { letter: 'T', points: 1, count: 6 },
    { letter: 'U', points: 1, count: 6 },
    { letter: 'L', points: 1, count: 5 },
    { letter: 'D', points: 2, count: 3 },
    { letter: 'M', points: 2, count: 3 },
    { letter: 'G', points: 2, count: 2 },
    { letter: 'B', points: 3, count: 2 },
    { letter: 'C', points: 3, count: 2 },
    { letter: 'P', points: 3, count: 2 },
    { letter: 'F', points: 4, count: 2 },
    { letter: 'H', points: 4, count: 2 },
    { letter: 'V', points: 4, count: 2 },
    { letter: 'J', points: 8, count: 1 },
    { letter: 'Q', points: 8, count: 1 },
    { letter: 'K', points: 10, count: 1 },
    { letter: 'W', points: 10, count: 1 },
    { letter: 'X', points: 10, count: 1 },
    { letter: 'Y', points: 10, count: 1 },
    { letter: 'Z', points: 10, count: 1 },
  ];

  readonly totalTiles = 102;

  createBag(): BoardTile[] {
    const bag: BoardTile[] = [];
    let id = 1;
    for (const definition of this.tileDefinitions) {
      for (let i = 0; i < definition.count; i++) {
        const isJoker = definition.letter === '?';
        bag.push({
          id: `tile-${id++}`,
          letter: definition.letter,
          assignedLetter: isJoker ? null : definition.letter,
          points: definition.points,
          isJoker,
          locked: false,
        });
      }
    }
    return this.shuffle(bag);
  }

  draw(bag: BoardTile[], count: number): BoardTile[] {
    return bag.splice(0, Math.max(0, count));
  }

  shuffle<T>(items: T[]): T[] {
    const copy = [...items];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  createBoard(): BoardCell[][] {
    const board = Array.from({ length: this.size }, (_, row) =>
      Array.from({ length: this.size }, (_, col): BoardCell => ({ tile: null, bonus: this.bonusAt(row, col) }))
    );
    return board;
  }

  private bonusAt(row: number, col: number): BonusType {
    const mt = [[0,0],[0,7],[0,14],[7,0],[7,14],[14,0],[14,7],[14,14]];
    const md = [[1,1],[2,2],[3,3],[4,4],[1,13],[2,12],[3,11],[4,10],[13,1],[12,2],[11,3],[10,4],[13,13],[12,12],[11,11],[10,10]];
    const lt = [[1,5],[1,9],[5,1],[5,5],[5,9],[5,13],[9,1],[9,5],[9,9],[9,13],[13,5],[13,9]];
    const ld = [[0,3],[0,11],[2,6],[2,8],[3,0],[3,7],[3,14],[6,2],[6,6],[6,8],[6,12],[7,3],[7,11],[8,2],[8,6],[8,8],[8,12],[11,0],[11,7],[11,14],[12,6],[12,8],[14,3],[14,11]];

    if (row === 7 && col === 7) return 'STAR';
    if (mt.some(([r, c]) => r === row && c === col)) return 'MT';
    if (md.some(([r, c]) => r === row && c === col)) return 'MD';
    if (lt.some(([r, c]) => r === row && c === col)) return 'LT';
    if (ld.some(([r, c]) => r === row && c === col)) return 'LD';
    return 'NORMAL';
  }
}
