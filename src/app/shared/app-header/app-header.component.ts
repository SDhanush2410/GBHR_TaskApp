
import { Component } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { AlertController } from '@ionic/angular/lazy';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-header',
  templateUrl: './app-header.component.html',
  styleUrls: ['./app-header.component.scss'],
  standalone: false
})
export class AppHeaderComponent {

  currentPage = 'home';
  menuOpen = false;

  constructor(
    private router: Router,
    private alertController: AlertController
  ) {
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        this.currentPage =
          event.urlAfterRedirects.split('/')[1] || 'home';

        this.menuOpen = false;
      });
  }

  toggleMenu() {
    this.menuOpen = !this.menuOpen;
  }

  navigateTo(page: string) {
    this.menuOpen = false;

    this.router.navigateByUrl(
      page.startsWith('/') ? page : '/' + page
    );
  }

  async logout() {

    const alert = await this.alertController.create({
      header: 'Logout',
      message: 'Are you sure you want to logout?',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Logout',
          handler: () => {
            localStorage.removeItem('userDetails');

            this.router.navigateByUrl('/login', {
              replaceUrl: true
            });
          }
        }
      ]
    });

    await alert.present();
  }
}
