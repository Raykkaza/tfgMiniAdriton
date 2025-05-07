import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private usernameSubject = new BehaviorSubject<string | null>(this.getUsernameFromStorage());
  username$ = this.usernameSubject.asObservable();

  constructor() { }

  private getUsernameFromStorage(): string | null {
    return localStorage.getItem('username');
  }

  login(username: string, email: string, img_perfil : string, token: string, user_id: string) {
    localStorage.setItem('username', username);
    localStorage.setItem('email', email);
    localStorage.setItem('img_perfil', img_perfil);
    localStorage.setItem('token', token);
    localStorage.setItem('user_id', user_id);
    this.usernameSubject.next(username);
  }

  logout() {
    localStorage.clear();
    this.usernameSubject.next(null);
  }
}
