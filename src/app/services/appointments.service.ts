import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { CalendarEvent } from 'angular-calendar';

@Injectable({
  providedIn: 'root'
})
export class AppointmentsService {
  private apiUrl = 'https://miniadritonff.com/api/get_appointments.php';

  constructor(private http: HttpClient) { }

  getAppointments(token: string): Observable<CalendarEvent[]> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.get<any[]>(this.apiUrl, { headers }).pipe(
      map(data => data.map(appointment => ({
        title: appointment.app_title,
        start: new Date(appointment.app_start),
        end: new Date(appointment.app_end)
      })))
    );
  }
}
