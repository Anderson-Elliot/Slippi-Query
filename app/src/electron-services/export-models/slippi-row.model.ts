import SlippiGame, { MetadataType, PlayerType, GameStartType, characters, FrameEntryType } from "@slippi/slippi-js";
import * as path from 'path';
import * as moment from 'moment';

export class SlippiRow {
  fileName: string;
  filePath: string;
  startAt: Date;
  playerOneName: string;
  playerTwoName: string;
  playerOne: PlayerType;
  playerTwo: PlayerType;
  charOneImgPath: string;
  charTwoImgPath: string;
  winningPlayer: number;
  originalSlippiGame: SlippiGame;

  static fromRaw(m: any | SlippiRaw, allChars: characters.CharacterInfo[]): SlippiRow {
    return {
      filePath: m.filePath,
      fileName: path.basename(m.filePath),
      originalSlippiGame: m.slippiGame,
      startAt: moment(m.metadata.startAt).toDate(),
      playerOneName: m.metadata && m.metadata.players !== undefined && m.metadata.players[0] !== undefined ? m.metadata.players[0].names['netplay'] : '',
      playerTwoName: m.metadata && m.metadata.players !== undefined && m.metadata.players[1] !== undefined ? m.metadata.players[1].names['netplay'] : '',
      playerOne: m.settings.players[0],
      playerTwo: m.settings.players[1],
      charOneImgPath: `assets\\stocks\\${characters.getCharacterName(m.settings.players[0].characterId)}\\${characters.getCharacterColorName(m.settings.players[0].characterId, m.settings.players[0].characterColor)}.png`,
      charTwoImgPath: `assets\\stocks\\${characters.getCharacterName(m.settings.players[1].characterId)}\\${characters.getCharacterColorName(m.settings.players[1].characterId, m.settings.players[1].characterColor)}.png`,
      winningPlayer: null
    }
  }

  static getWinningPlayer(lastFrame: FrameEntryType): number {
    const p1Stocks = lastFrame.players[0].post.stocksRemaining;
    const p2Stocks = lastFrame.players[1].post.stocksRemaining;

    if (p1Stocks !== 0 && p2Stocks !== 0) {
      return 0;
    }

    if (p1Stocks > 0) {
      return 1;
    }

    return 2;
  }
}

export class SlippiRaw {
  filePath: string;
  metadata: MetadataType;
  settings: GameStartType;
  lastFrame: FrameEntryType;
  slippiGame: SlippiGame

  constructor(
    _filePath: string,
    _slippiGame: SlippiGame,
    _metadata: MetadataType,
    _settings: GameStartType) {
    this.filePath = _filePath;
    this.slippiGame = _slippiGame;
    this.metadata = _metadata;
    this.settings = _settings;
    this.lastFrame = null;
  }
}
