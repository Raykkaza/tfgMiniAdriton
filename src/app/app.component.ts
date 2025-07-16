import { Component, OnInit } from '@angular/core';
import { AuthService } from './services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  username: string | null = null;
  mostrarMenu = false;
  isAdmin = false;
  mostrarMenuAdmin = false;

  constructor(private auth: AuthService, private router: Router) { }

  ngOnInit() {
    this.auth.username$.subscribe(valor => {
      this.username = valor;
    });

    this.auth.isAdmin$.subscribe(esAdmin => {
      this.isAdmin = esAdmin;
    });
  }

  logout() {
    this.auth.logout();
    this.router.navigate(['/']);
  }
}
