import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  username: string = '';
  email: string = '';
  password: string = '';

  constructor(
    private http: HttpClient,
    private router: Router,
    private auth: AuthService
  ) { }

  onSubmit() {
    const datos = {
      email: this.email,
      password: this.password
    };

    this.http.post<any>('https://miniadritonff.com/api/login.php', datos).subscribe({
      next: (respuesta) => {
        if (respuesta.success && respuesta.token) {
          this.auth.login(respuesta.username, respuesta.email, respuesta.img_perfil, respuesta.token, respuesta.user_id);
          this.router.navigate(['/perfil']);
        } else {
          alert('Error al iniciar sesión: credenciales inválidas o token ausente.');
        }
      },
      error: (error) => {
        console.error('Error al iniciar sesión:', error.error?.error || error.message);
        alert('No se pudo iniciar sesión. Comprueba tus datos e inténtalo de nuevo.');
      }
    });
  }
}
