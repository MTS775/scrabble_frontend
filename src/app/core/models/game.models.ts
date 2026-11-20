export type TileLetter = '?' | 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H' | 'I' | 'J' | 'K' | 'L' | 'M' | 'N' | 'O' | 'P' | 'Q' | 'R' | 'S' | 'T' | 'U' | 'V' | 'W' | 'X' | 'Y' | 'Z';

export interface TileDefinition {
  letter: TileLetter;
  points: number;
  count: number;
}

export interface BoardTile {
  id: string;
  letter: TileLetter;
  assignedLetter: string | null;
  points: number;
  isJoker: boolean;
  locked: boolean;
}

export type BonusType = 'NORMAL' | 'MD' | 'MT' | 'LD' | 'LT' | 'STAR';

export interface BoardCell {
  tile: BoardTile | null;
  bonus: BonusType;
}

export interface Player {
  name: string;
  score: number;
  rack: (BoardTile | null)[];
}
