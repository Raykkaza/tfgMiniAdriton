import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { catchError, map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AdminGuard implements CanActivate {

  constructor(private http: HttpClient, private router: Router) { }

  canActivate(): Observable<boolean> {
    const token = localStorage.getItem('token');
    if (!token) {
      this.router.navigate(['/']);
      return of(false);
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.get<any>('https://miniadritonff.com/api/check_role.php', { headers }).pipe(
      map(response => {
        if (response.rol === 1) return true;
        this.router.navigate(['/']);
        return false;
      }),
      catchError(() => {
        this.router.navigate(['/']);
        return of(false);
      })
    );
  }
}
