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

    // Score de 0 a 5 (una por cada regla)
    let score = 0;
    if (this.hasMinLength) score++;
    if (this.hasUpper) score++;
    if (this.hasLower) score++;
    if (this.hasNumber) score++;
    if (this.hasSpecial) score++;

    this.strengthScore = score;
    this.strengthPercent = (score / 5) * 100;

    // Etiquetas y estilos estándar
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
    // Política mínima razonable: al menos 4 de 5 reglas cumplidas
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

    // Validaciones extra por seguridad
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
          this.error = 'Error al registrar el usuario.';
        }
      },
      error: err => {
        this.error = err.error?.error || 'Error inesperado al conectar con el servidor.';
      }
    });
  }
}
