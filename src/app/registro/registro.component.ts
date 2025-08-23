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
  confirmPassword = '';

  mensaje = '';
  error = '';

  // Señalización de duplicados
  emailTaken = false;
  usernameTaken = false;

  // Estado del medidor
  strengthScore = 0; // 0–5
  strengthPercent = 0; // 0–100
  strengthLabel = 'Muy débil';
  progressBarClass = 'bg-danger';
  progressTextClass = 'text-danger';

  // Reglas individuales (para marcar cada línea)
  hasMinLength = false;
  hasUpper = false;
  hasLower = false;
  hasNumber = false;
  hasSpecial = false;

  constructor(private http: HttpClient, private router: Router) { }

  // Actualiza reglas y score cada vez que se escribe en password/confirm
  onPasswordInput(): void {
    const pwd = this.password || '';

    this.hasMinLength = pwd.length >= 8;
    this.hasUpper = /[A-Z]/.test(pwd);
    this.hasLower = /[a-z]/.test(pwd);
    this.hasNumber = /[0-9]/.test(pwd);
    this.hasSpecial = /[^A-Za-z0-9]/.test(pwd);

    let score = 0;
    if (this.hasMinLength) score++;
    if (this.hasUpper) score++;
    if (this.hasLower) score++;
    if (this.hasNumber) score++;
    if (this.hasSpecial) score++;

    this.strengthScore = score;
    this.strengthPercent = (score / 5) * 100;

    if (score <= 1) {
      this.strengthLabel = 'Muy débil';
      this.progressBarClass = 'bg-danger';
      this.progressTextClass = 'text-danger';
    } else if (score === 2) {
      this.strengthLabel = 'Débil';
      this.progressBarClass = 'bg-danger';
      this.progressTextClass = 'text-danger';
    } else if (score === 3) {
      this.strengthLabel = 'Aceptable';
      this.progressBarClass = 'bg-warning';
      this.progressTextClass = 'text-warning';
    } else if (score === 4) {
      this.strengthLabel = 'Fuerte';
      this.progressBarClass = 'bg-success';
      this.progressTextClass = 'text-success';
    } else {
      this.strengthLabel = 'Muy fuerte';
      this.progressBarClass = 'bg-success';
      this.progressTextClass = 'text-success';
    }
  }

  passwordsMatch(): boolean {
    return this.password === this.confirmPassword;
  }

  isPasswordStrongEnough(): boolean {
    return this.strengthScore >= 4;
  }

  get canSubmit(): boolean {
    return (
      !!this.username &&
      !!this.email &&
      !!this.password &&
      !!this.confirmPassword &&
      this.passwordsMatch() &&
      this.isPasswordStrongEnough()
    );
  }

  registrarUsuario(): void {
    this.mensaje = '';
    this.error = '';
    this.emailTaken = false;
    this.usernameTaken = false;

    if (!this.username || !this.email || !this.password || !this.confirmPassword) {
      this.error = 'Por favor, completa todos los campos.';
      return;
    }

    if (!this.passwordsMatch()) {
      this.error = 'Las contraseñas no coinciden.';
      return;
    }

    if (!this.isPasswordStrongEnough()) {
      this.error = 'La contraseña es demasiado débil. Asegúrate de cumplir al menos 4 requisitos.';
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
          this.error = res.error || 'Error al registrar el usuario.';
        }
      },
      error: err => {
        if (err.status === 409) {
          const code = err.error?.code;
          if (code === 'EMAIL_TAKEN') {
            this.emailTaken = true;
            this.error = 'Ese email ya está registrado. Prueba con otro o inicia sesión.';
          } else if (code === 'USERNAME_TAKEN') {
            this.usernameTaken = true;
            this.error = 'Ese nombre de usuario ya está en uso. Prueba con otro.';
          } else {
            this.error = err.error?.error || 'Ya existe un usuario con esos datos.';
          }
        } else if (err.status === 400) {
          this.error = err.error?.error || 'Datos inválidos.';
        } else {
          this.error = err.error?.error || 'Error inesperado al conectar con el servidor.';
        }
      }
    });
  }
}
