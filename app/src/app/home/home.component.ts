import { Component, OnInit, ViewChild, ElementRef, NgZone } from '@angular/core';
import { SlippiService } from '../shared/services/slippi.service';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource, MatTable } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';
import { IFilter, Filter } from '../shared/models/filters.model';
import { SlippiRow, SlippiRaw } from '../../electron-services/export-models/slippi-row.model';
import {  fromEvent } from 'rxjs';
import { debounceTime, distinctUntilChanged, tap, filter } from 'rxjs/operators';
import { MatDatepicker } from '@angular/material/datepicker';
import { ipcRenderer } from 'electron';

import * as $ from 'jquery';
import * as moment from 'moment';
import * as R from 'ramda';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  @ViewChild('startAtPicker') startAtDatePicker: MatDatepicker<Date>;
  @ViewChild('players') playerInput: ElementRef;
  @ViewChild('replayTable') replayTable: MatTable<SlippiRow>;

  moment: any = moment;

  isLoading = true;
  filters: IFilter = new Filter();
  data: SlippiRow[] = [];
  dataSource: MatTableDataSource<SlippiRow>;
  activeDates: number[];
  displayedColumns= ["startAt", "playerOneName", "playerTwoName"];

  // properties for loading winning player.
  currentlyLoadingSlippiRows: SlippiRow[];
  count: number;

  constructor(public slippiService: SlippiService, private ngZone: NgZone) { }

  ngOnInit() {
    this.slippiService.$replays.subscribe(replays => {
      if (replays !== null) {
        this.ngZone.run(_ => {
          const allReplays = replays.sort(this.sortMetadata);
          const allCharacterInfo = this.slippiService.getAllCharacterInfo();
          this.data = allReplays.map(r => SlippiRow.fromRaw(r, allCharacterInfo));
          this.dataSource = new MatTableDataSource(this.data);
          this.dataSource.paginator = this.paginator;
          this.dataSource.sort = this.sort;

          this.getActiveDates();
          this.isLoading = false;
          setTimeout(_ => {
            this.loadRenderedDataWinningPlayer();
          }, 600)
        });
      }
    });
  }

  async ngAfterViewInit() {
    this.delegateEvents();
    this.debounceInputs();
    const allFiles = await this.slippiService.getAllSlippiFiles();
    this.slippiService.getReplays(allFiles);
  }

  applyFilter() {
    const filter = this.filters;
    const startAt = (e: SlippiRow) => filter.startAt == null || moment(e.startAt).startOf('day').diff(moment(filter.startAt).startOf('day'), 'days') === 0;
    const players = (e: SlippiRow) => !filter.players || `${e.playerOneName}`.toLowerCase().includes(filter.players.toLowerCase()) || `${e.playerTwoName}`.toLowerCase().includes(filter.players.toLowerCase());
    const filters = R.allPass([startAt, players])

    this.dataSource.data = this.data.filter(d => filters(d));
    this.replayTable.renderRows();

    setTimeout(_ => this.loadRenderedDataWinningPlayer(), 1000);
    this.getActiveDates();
  }

  highlightActiveDates() {
    setTimeout(()=>{
      // Highlight calendar days
      $('.mat-calendar-body-cell').each((index, element) => {
        const date = moment(element.ariaLabel);
        if (date.isValid() && this.activeDates.includes(date.toDate().valueOf())) {
          $(element).addClass('active-date');
        }
      });
    }, 50);
  }

  private sortMetadata(a: SlippiRaw, b: SlippiRaw): number {
    if (!a.metadata.startAt && !b.metadata.startAt) {
      return 0;
    }
    if (!b.metadata.startAt && a.metadata.startAt) {
      return 1;
    }
    if (!a.metadata.startAt && b.metadata.startAt) {
      return -1;
    }

    return moment(b.metadata.startAt).valueOf() - moment(a.metadata.startAt).valueOf();
  }

  private delegateEvents() {
    $(document).on('click', '.mat-calendar-previous-button', () => {
      this.highlightActiveDates();
    });

    $(document).on('click', '.mat-calendar-next-button', () => {
      this.highlightActiveDates();
    });

    this.paginator.page.subscribe(event => {
      setTimeout(_ => {
        this.loadRenderedDataWinningPlayer();
      }, 500);
    });
  }

  private async loadRenderedDataWinningPlayer() {
    ipcRenderer.removeListener('get-latest-frame-reply', this.setWinningPlayer);
    this.currentlyLoadingSlippiRows = this.dataSource.connect().value.filter(d => d.winningPlayer === null);
    this.count = 0;
    ipcRenderer.on('get-latest-frame-reply', this.setWinningPlayer);

    if  (this.currentlyLoadingSlippiRows.length > 0) {
      ipcRenderer.send('get-latest-frame', { index: 0, fileName: this.currentlyLoadingSlippiRows[0].fileName })
    };
  }

  private setWinningPlayer = (event: any, arg: string) => {
    const reply = JSON.parse(arg);
    if (this.currentlyLoadingSlippiRows && this.currentlyLoadingSlippiRows[reply.index]) {
      this.ngZone.run(_ => {
        this.currentlyLoadingSlippiRows[reply.index].winningPlayer = reply.winningPlayer;
      });
    }
    this.count += 1;
    if (this.count > this.currentlyLoadingSlippiRows.length) {
      ipcRenderer.removeListener('get-latest-frame-reply', this.setWinningPlayer);
    } else {
      ipcRenderer.send('get-latest-frame', { index: this.count, fileName: this.currentlyLoadingSlippiRows[this.count].fileName })
    }
  };

  private debounceInputs() {
    [
      this.playerInput
    ].forEach(input => this.debounceInput(input));
  }

  private debounceInput(element: ElementRef<any>) {
    fromEvent(element.nativeElement,'keyup')
    .pipe(
        filter(Boolean),
        debounceTime(400),
        distinctUntilChanged(),
        tap((text) => {
          this.applyFilter();
        })
    )
    .subscribe();
  }

  private getActiveDates() {
    if (this.dataSource.data) {
      this.activeDates =
        this.dataSource.data.map(d => moment(d.startAt).startOf('day').toDate().getTime())
          .filter(this.distinctDates);
    }
  }

  private distinctDates(dateValue: number, index: number, self: number[]) {
    return self.findIndex(d => d === dateValue) === index;
  }
}
