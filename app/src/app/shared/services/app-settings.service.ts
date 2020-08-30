import { Injectable } from '@angular/core';
import { AppSettings } from '../models/app-settings.model';
import * as fs from 'fs';

@Injectable({
  providedIn: 'root',
})
export class AppSettingsService {
  private appSettings: AppSettings;

  constructor() {
    let rawdata = fs.readFileSync(__dirname + '\\assets\\appsettings.json', 'utf8');
    this.appSettings = JSON.parse(rawdata);
    console.log('app settings', this.appSettings);
  }

  getAppSettings() {
    return this.appSettings;
  }
}