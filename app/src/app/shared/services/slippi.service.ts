import { Injectable } from '@angular/core';
import { SlippiGame, MetadataType, characters } from '@slippi/slippi-js';
import * as fs from 'fs';
import { promisify } from 'util';
import { homedir } from 'os';
import { BehaviorSubject } from 'rxjs';
import { ipcRenderer } from 'electron';
import { SlippiRaw } from '../../../electron-services/export-models/slippi-row.model';
const readdir = promisify(fs.readdir);

@Injectable({
  providedIn: 'root',
})
export class SlippiService {
  private _baseDirectory: string;
  public $replays: BehaviorSubject<any[]> = new BehaviorSubject(null);

  constructor() {
    this.setBaseDirectory(`${homedir()}\\Documents\\Slippi\\`);
  }

  getReplays(fileNames: string[]): void {
    ipcRenderer.on('get-replays-reply', (event: any, arg: string) => {
      const replays = JSON.parse(arg);
      this.$replays.next(replays);
    });
    ipcRenderer.send('get-replays', fileNames);
  }

  getAllCharacterInfo() {
    return characters.getAllCharacters();
  }

  getLatestFrame(filename: string): any {
    return ipcRenderer.sendSync('get-latest-frame', filename);
  }

  // Directory related stuff

  setBaseDirectory(dir: string) {
    this._baseDirectory = dir;
  }

  async getAllSlippiFiles(): Promise<string[]> {
    return await readdir(this._baseDirectory);
  }
}