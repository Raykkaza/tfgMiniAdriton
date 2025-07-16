import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

@Component({
  selector: 'app-registro',
  templateUrl: './registro.component.html',
  styleUrls: ['./registro.component.css']
})
export class RegistroComponent {
  username = '';
  email = '';
  password = '';

  mensaje = '';
  error = '';

  constructor(private http: HttpClient, private router: Router) { }

  registrarUsuario(): void {
    this.mensaje = '';
    this.error = '';

    if (!this.username || !this.email || !this.password) {
      this.error = 'Por favor, completa todos los campos.';
      return;
    }

    const payload = {
      username: this.username,
      email: this.email,
      password: this.password
    };

    this.http.post<any>('https://miniadritonff.com/api/add_user.php', payload).subscribe({
      next: res => {
        if (res.success) {
          this.mensaje = '¡Usuario registrado con éxito!';
          setTimeout(() => {
            this.router.navigate(['/login']);
          }, 1500);
        } else {
          this.error = 'Error al registrar el usuario.';
        }
      },
      error: err => {
        this.error = err.error?.error || 'Error inesperado al conectar con el servidor.';
      }
    });
  }
}
