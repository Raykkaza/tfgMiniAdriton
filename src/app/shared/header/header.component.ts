import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit {
  username: string | null = null;
  mostrarMenu = false;

  // Flags simples para mostrar/ocultar enlaces
  loggedIn = false;
  activeSub = false;

  constructor(
    private auth: AuthService,
    private router: Router,
    private http: HttpClient
  ) { }

  ngOnInit(): void {
    // Refleja cambios de sesión
    this.auth.username$.subscribe(valor => {
      this.username = valor;
      this.loggedIn = !!valor && !!localStorage.getItem('token');
      // Cuando haya sesión, comprobamos suscripción
      if (this.loggedIn) {
        this.checkSub();
      } else {
        this.activeSub = false;
      }
    });

    // Si recargas y ya hay token, comprueba igualmente
    if (localStorage.getItem('token')) {
      this.loggedIn = true;
      this.checkSub();
    }
  }

  private checkSub(): void {
    const token = localStorage.getItem('token');
    if (!token) {
      this.activeSub = false;
      return;
    }

    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });

    this.http.get<any>('https://miniadritonff.com/api/check_user_subscription.php', { headers })
      .subscribe({
        next: (res) => {
          this.activeSub = !!res?.active_sub;
        },
        error: () => {
          // Si falla, por defecto no mostramos Consultas ni Suscribirme
          this.activeSub = false;
        }
      });
  }

  logout() {
    this.auth.logout();
    this.loggedIn = false;
    this.activeSub = false;
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
