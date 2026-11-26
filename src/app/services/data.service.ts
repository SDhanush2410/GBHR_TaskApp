import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface IPLPlayer {
  id: string;
  rank: number;
  name: string;
  matches: number;
  runs: number;
}

@Injectable({
  providedIn: 'root'
})
export class DataService {

  private playersSubject = new BehaviorSubject<IPLPlayer[]>([]);

  players$: Observable<IPLPlayer[]> =
    this.playersSubject.asObservable();

  constructor() {
    this.loadPlayers();
  }

  getPlayers(): IPLPlayer[] {
    return this.playersSubject.value;
  }

  updatePlayer(id: string, updatedData: Partial<IPLPlayer>): void {
    const players = this.getPlayers().map(player =>
      player.id === id
        ? { ...player, ...updatedData }
        : player
    );

    this.publish(players);
  }

  addPlayer(player: IPLPlayer): void {
    const players = [...this.getPlayers(), player];
    this.publish(players);
  }

  deletePlayer(id: string): void {
    const players = this.getPlayers().filter(
      player => player.id !== id
    );

    this.publish(players);
  }

  resetData(): void {
    localStorage.removeItem('ipl_players_data');
    this.publish(this.getDefaultPlayers());
  }

  private publish(players: IPLPlayer[]): void {
    const sortedPlayers = [...players]
      .sort((a, b) => b.runs - a.runs)
      .map((player, index) => ({
        ...player,
        rank: index + 1
      }));

    localStorage.setItem(
      'ipl_players_data',
      JSON.stringify(sortedPlayers)
    );

    this.playersSubject.next(sortedPlayers);
  }

  private loadPlayers(): void {
    const savedData = localStorage.getItem('ipl_players_data');

    if (savedData) {
      try {
        this.publishWithoutSaving(JSON.parse(savedData));
        return;
      } catch {
        localStorage.removeItem('ipl_players_data');
      }
    }

    this.publish(this.getDefaultPlayers());
  }

  private publishWithoutSaving(players: IPLPlayer[]): void {
    const sortedPlayers = [...players]
      .sort((a, b) => b.runs - a.runs)
      .map((player, index) => ({
        ...player,
        rank: index + 1
      }));

    this.playersSubject.next(sortedPlayers);
  }

  private getDefaultPlayers(): IPLPlayer[] {
    return [
      { id: '1', rank: 1, name: 'Virat Kohli', matches: 282, runs: 9336 },
      { id: '2', rank: 2, name: 'Rohit Sharma', matches: 281, runs: 7329 },
      { id: '3', rank: 3, name: 'Shikhar Dhawan', matches: 222, runs: 6769 },
      { id: '4', rank: 4, name: 'David Warner', matches: 184, runs: 6565 },
      { id: '5', rank: 5, name: 'KL Rahul', matches: 160, runs: 5815 },
      { id: '6', rank: 6, name: 'Suresh Raina', matches: 204, runs: 5528 },
      { id: '7', rank: 7, name: 'MS Dhoni', matches: 277, runs: 5439 },
      { id: '8', rank: 8, name: 'Ajinkya Rahane', matches: 212, runs: 5367 },
      { id: '9', rank: 9, name: 'Sanju Samson', matches: 190, runs: 5181 },
      { id: '10', rank: 10, name: 'AB de Villiers', matches: 183, runs: 5162 },
      { id: '11', rank: 11, name: 'Chris Gayle', matches: 141, runs: 4965 },
      { id: '12', rank: 12, name: 'Robin Uthappa', matches: 205, runs: 4952 },
      { id: '13', rank: 13, name: 'Dinesh Karthik', matches: 257, runs: 4842 },
      { id: '14', rank: 14, name: 'Faf du Plessis', matches: 154, runs: 4773 },
      { id: '15', rank: 15, name: 'Jos Buttler', matches: 138, runs: 4646 },
      { id: '16', rank: 16, name: 'Shubman Gill', matches: 134, runs: 4598 },
      { id: '17', rank: 17, name: 'Suryakumar Yadav', matches: 179, runs: 4581 },
      { id: '18', rank: 18, name: 'Ambati Rayudu', matches: 204, runs: 4348 },
      { id: '19', rank: 19, name: 'Shreyas Iyer', matches: 147, runs: 4229 },
      { id: '20', rank: 20, name: 'Gautam Gambhir', matches: 154, runs: 4217 }
    ];
  }
}