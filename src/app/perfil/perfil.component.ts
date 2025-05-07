import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';

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

  constructor(private router: Router, private http: HttpClient) { }

  ngOnInit(): void {
    this.username = localStorage.getItem('username') || '';
    this.email = localStorage.getItem('email') || '';
    const img = localStorage.getItem('img_perfil');
    this.imgPerfilUrl = img ? `https://miniadritonff.com/api/${img}` : 'https://miniadritonff.com/api/uploads/placeholder.png';

    this.cargarInfoAdicional();
    this.cargarPagos();
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
}