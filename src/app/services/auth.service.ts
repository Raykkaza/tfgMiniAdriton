import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private usernameSubject = new BehaviorSubject<string | null>(this.getUsernameFromStorage());
  username$ = this.usernameSubject.asObservable();

  private isAdminSubject = new BehaviorSubject<boolean>(false);
  isAdmin$ = this.isAdminSubject.asObservable();

  constructor(private http: HttpClient) {
    this.checkRole(); // Se ejecuta al construir el servicio
  }

  private getUsernameFromStorage(): string | null {
    return localStorage.getItem('username');
  }

  login(username: string, email: string, img_perfil: string, token: string, user_id: string) {
    localStorage.setItem('username', username);
    localStorage.setItem('email', email);
    localStorage.setItem('img_perfil', img_perfil);
    localStorage.setItem('token', token);
    localStorage.setItem('user_id', user_id);
    this.usernameSubject.next(username);
    this.checkRole(); // Revalidar rol
  }

  logout() {
    localStorage.clear();
    this.usernameSubject.next(null);
    this.isAdminSubject.next(false);
  }

  private checkRole() {
    const token = localStorage.getItem('token');
    if (!token) {
      this.isAdminSubject.next(false);
      return;
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    this.http.get<any>('https://miniadritonff.com/api/check_role.php', { headers }).subscribe({
      next: (res) => {
        const rol = res.rol;
        this.isAdminSubject.next(rol === 1);
      },
      error: () => {
        this.isAdminSubject.next(false);
      }
    });
  }
}
