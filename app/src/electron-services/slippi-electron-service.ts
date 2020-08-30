import { SlippiGame, MetadataType, characters } from '@slippi/slippi-js';
import * as fs from 'fs';
import { promisify } from 'util';
import { homedir } from 'os';
import { BehaviorSubject } from 'rxjs';
import { SlippiRaw, SlippiRow } from './export-models/slippi-row.model';
const { ipcMain } = require('electron');

export class SlippiElectronService {
  private _baseDirectory: string;

  constructor() {
    this.setBaseDirectory(`${homedir()}\\Documents\\Slippi\\`);
  }

  initialize() {
    console.log(ipcMain);
    ipcMain.on('get-replays', (event: any, arg: any) => {
      const filenames = arg as string[];
      const replays = this.getReplays(filenames);
      event.sender.send('get-replays-reply', JSON.stringify(replays));
    });

    ipcMain.on('get-latest-frame', (event, arg) => {
      const latestFrame = this.getLatestFrame(arg.fileName);
      const winningPlayer = SlippiRow.getWinningPlayer(latestFrame);
      event.sender.send('get-latest-frame-reply', JSON.stringify({ index: arg.index, winningPlayer }));
    })
  }

  getReplays(fileNames: string[]): SlippiRaw[] {
    return fileNames
      .map(file => {
        const g = new SlippiGame(this._baseDirectory + file);
        return new SlippiRaw(g.getFilePath(), g, g.getMetadata(), g.getSettings());
      })
      .filter(r => r !== null && r !== undefined && r.metadata !== null && r.metadata !== undefined);
  }

  getAllCharacterInfo() {
    return characters.getAllCharacters();
  }

  getLatestFrame(fileName) {
    return new SlippiGame(this._baseDirectory + fileName).getLatestFrame();
  }

  // Directory related stuff

  setBaseDirectory(dir: string) {
    this._baseDirectory = dir;
  }

  async getAllSlippiFiles(): Promise<string[]> {
    const readdir = promisify(fs.readdir);
    return await readdir(this._baseDirectory);
  }
}