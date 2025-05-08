import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-perfil',
  templateUrl: './perfil.component.html',
  styleUrls: ['./perfil.component.css']
})
export class PerfilComponent implements OnInit {
  username: string = '';
  email: string = '';
  userData: any = null;
  extraComments: string = '';
  imgPerfilUrl: string = '';
  pagos: any[] = [];
  suscrito: boolean = false;
  fechaExpiracion: string | null = null;
  

  constructor(private router: Router, private http: HttpClient, private auth: AuthService) { }

  ngOnInit(): void {
    const token = localStorage.getItem('token') || '';

    if (!token) {
      this.sessionCaducada();
      return;
    }

    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });

    // Verifica el token antes de cargar el resto
    this.http.get<any>('https://miniadritonff.com/api/check_user_subscription.php', { headers }).subscribe({
      next: (res) => {
        this.username = localStorage.getItem('username') || '';
        this.email = localStorage.getItem('email') || '';
        const img = localStorage.getItem('img_perfil');
        this.imgPerfilUrl = img ? `https://miniadritonff.com/api/${img}` : 'https://miniadritonff.com/api/uploads/placeholder.png';

        this.suscrito = res.active_sub;
        this.fechaExpiracion = res.sub_expiration_date
          ? new Date(res.sub_expiration_date).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })
          : null;

        this.cargarInfoAdicional();
        this.cargarPagos();
      },
      error: () => {
        this.sessionCaducada();
      }
    });
  }

  sessionCaducada() {
    this.auth.logout();
    this.router.navigate(['/sesion-caducada']);
  }



  cargarInfoAdicional() {
    const token = localStorage.getItem('token') || '';
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });

    this.http.get<any>('https://miniadritonff.com/api/get_user_data.php', { headers }).subscribe({
      next: (res) => {
        this.userData = res.user_data;
        this.extraComments = res.extra_comments;
      },
      error: (err) => {
        console.error('Error al obtener datos del perfil:', err);
      }
    });
  }

  cargarPagos() {
    const token = localStorage.getItem('token') || '';
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });

    this.http.get<any>('https://miniadritonff.com/api/get_user_payments.php', { headers }).subscribe({
      next: (res) => {
        this.pagos = res.pagos || [];
      },
      error: (err) => {
        console.error('Error al obtener pagos:', err);
      }
    });
  }

  irAEditar() {
    this.router.navigate(['/actualizar-perfil']);
  }

  irAPasarela() {
    window.location.href = 'https://miniadritonff.com/pago';
  }
}
