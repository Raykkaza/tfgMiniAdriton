import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

export interface EmailPayload {
  to: string;
  subject: string;
  text?: string;   
  html?: string;   
}

@Injectable({ providedIn: 'root' })
export class EmailService {
  private endpoint = 'https://miniadritonff.com/api/mail/sendEmail.php';

  constructor(private http: HttpClient) { }

  send(payload: EmailPayload): Observable<{ success: boolean; error?: string }> {
    return this.http.post<{ success: boolean; error?: string }>(this.endpoint, payload)
      .pipe(
        catchError(err => {
          console.error('Error enviando email', err);
          return throwError(() => err);
        })
      );
  }
}
