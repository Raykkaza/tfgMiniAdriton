import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

@Injectable({
    providedIn: 'root'
})
export class SubscriptionGuard implements CanActivate {
    constructor(private http: HttpClient, private router: Router) { }

    canActivate(): Observable<boolean> {
        const token = localStorage.getItem('token');

        if (!token) {
            this.router.navigate(['/login']);
            return of(false);
        }

        const headers = new HttpHeaders({
            Authorization: `Bearer ${token}`
        });

        return this.http.get<any>('https://miniadritonff.com/api/check_user_subscription.php', { headers }).pipe(
            map(response => {
                if (response.active_sub) {
                    return true;
                } else {
                    console.log('SubscriptionGuard: User does not have an active subscription');
                    
                    this.router.navigate(['/suscripcion']);
                    return false;
                }
            }),
            catchError(() => {
                console.log('SubscriptionGuard: User does not have an active subscription');

                this.router.navigate(['/subs']);
                return of(false);
            })
        );
    }
}
