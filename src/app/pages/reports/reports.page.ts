
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';

import {
  DataService,
  IPLPlayer
} from '../../services/data.service';

@Component({
  selector: 'app-reports',
  templateUrl: './reports.page.html',
  styleUrls: ['./reports.page.scss'],
  standalone: false
})
export class ReportsPage implements OnInit, OnDestroy {

  players: IPLPlayer[] = [];

  showForm = false;
  isEditing = false;
  editingId: string | null = null;

  formData = {
    name: '',
    matches: 0,
    runs: 0
  };

  private subscription!: Subscription;

  constructor(private dataService: DataService) {}

  ngOnInit(): void {

    this.subscription = this.dataService.players$.subscribe(
      (data: IPLPlayer[]) => {
        this.players = data;
      }
    );

  }

  openAddForm(): void {

    this.isEditing = false;
    this.editingId = null;

    this.formData = {
      name: '',
      matches: 0,
      runs: 0
    };

    this.showForm = true;

  }

  openEditForm(player: IPLPlayer): void {

    this.isEditing = true;
    this.editingId = player.id;

    this.formData = {
      name: player.name,
      matches: player.matches,
      runs: player.runs
    };

    this.showForm = true;

  }

  savePlayer(): void {

    if (!this.formData.name.trim()) {
      alert('Please enter player name');
      return;
    }

    if (
      this.formData.matches < 0 ||
      this.formData.runs < 0 ||
      !Number.isInteger(this.formData.matches) ||
      !Number.isInteger(this.formData.runs)
    ) {
      alert('Please enter valid matches and runs');
      return;
    }

    if (this.isEditing && this.editingId) {

      this.dataService.updatePlayer(
        this.editingId,
        {
          name: this.formData.name.trim(),
          matches: this.formData.matches,
          runs: this.formData.runs
        }
      );

    } else {

      const newPlayer: IPLPlayer = {
        id: Date.now().toString(),
        rank: this.players.length + 1,
        name: this.formData.name.trim(),
        matches: this.formData.matches,
        runs: this.formData.runs
      };

      this.dataService.addPlayer(newPlayer);

    }

    this.closeForm();

  }

  deletePlayer(id: string): void {

    const confirmed = confirm(
      'Are you sure you want to delete this player?'
    );

    if (confirmed) {
      this.dataService.deletePlayer(id);
    }

  }

  resetData(): void {

    const confirmed = confirm(
      'Are you sure you want to reset all player data?'
    );

    if (confirmed) {
      this.dataService.resetData();
    }

  }

  closeForm(): void {

    this.showForm = false;
    this.isEditing = false;
    this.editingId = null;

  }

  ngOnDestroy(): void {

    if (this.subscription) {
      this.subscription.unsubscribe();
    }

  }

}
