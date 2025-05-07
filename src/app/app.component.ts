import { Component } from '@angular/core';
import { AuthService } from './services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  username: string | null = null;
  mostrarMenu = false;

  constructor(private auth: AuthService, private router: Router) { }

  ngOnInit() {
    this.auth.username$.subscribe(valor => {
      this.username = valor;
      console.log('Username:', this.username);
      
    });
  }

  logout() {
    this.auth.logout();
    this.router.navigate(['/']);
  }
}
