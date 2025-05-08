import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit {
  username: string | null = null;
  mostrarMenu = false;

  constructor(private auth: AuthService, private router: Router) { }

  ngOnInit(): void {
    this.auth.username$.subscribe(valor => {
      this.username = valor;
    });
  }

  logout() {
    this.auth.logout();
    this.router.navigate(['/']);
  }

  toggleMenu() {
    this.mostrarMenu = !this.mostrarMenu;
  }

  cerrarMenu() {
    setTimeout(() => {
      this.mostrarMenu = false;
    }, 150);
  }

}
