import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { CalendarEvent } from 'angular-calendar';

export interface AppointmentsResponse {
  userId: number;
  events: CalendarEvent[];
}

@Injectable({
  providedIn: 'root'
})
export class AppointmentsService {
  private baseUrl = 'https://miniadritonff.com/api';

  constructor(private http: HttpClient) { }

  private getHeaders(token: string): HttpHeaders {
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  getAppointments(token: string): Observable<AppointmentsResponse> {
    return this.http.get<any>(`${this.baseUrl}/get_appointments.php`, {
      headers: this.getHeaders(token)
    }).pipe(
      map(response => {
        const events: CalendarEvent[] = response.appointments.map((appointment: any) => ({
          title: appointment.app_title,
          start: new Date(appointment.app_start),
          end: new Date(appointment.app_end),
          meta: {
            userId: appointment.user_id,
            status: appointment.status,
            app_id: appointment.app_id
          }
        }));
        return {
          userId: response.user_id,
          events
        };
      })
    );
  }

  getUserRole(token: string): Observable<{ userId: number, rol: number }> {
    return this.http.get<{ user_id: number, rol: number }>(
      `${this.baseUrl}/check_role.php`,
      { headers: this.getHeaders(token) }
    ).pipe(
      map(res => ({
        userId: res.user_id,
        rol: res.rol
      }))
    );
  }

  createAppointment(token: string, cita: {
    app_title: string,
    app_start: string,
    app_end: string
  }): Observable<any> {
    return this.http.post(`${this.baseUrl}/create_appointment.php`, cita, {
      headers: this.getHeaders(token)
    });
  }

  approveAppointment(token: string, app_id: number): Observable<any> {
    return this.http.post(`${this.baseUrl}/approve_appointment.php`, { app_id }, {
      headers: this.getHeaders(token)
    });
  }

  deleteAppointment(token: string, app_id: number): Observable<any> {
    return this.http.post(`${this.baseUrl}/delete_appointment.php`, { app_id }, {
      headers: this.getHeaders(token)
    });
  }

  editAppointment(token: string, cita: {
    app_id: number,
    app_title: string,
    app_start: string,
    app_end: string
  }): Observable<any> {
    return this.http.post(`${this.baseUrl}/edit_appointment.php`, cita, {
      headers: this.getHeaders(token)
    });
  }
}
