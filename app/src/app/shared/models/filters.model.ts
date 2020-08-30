export interface IFilter {
  startAt: Date;
  players: string;

}

export class Filter implements IFilter {
  public startAt: Date = null;
  public players = '';
}