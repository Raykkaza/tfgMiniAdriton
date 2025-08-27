import { Component, OnInit } from '@angular/core';
import { AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { CalendarEvent } from 'angular-calendar';
import { CalendarView } from 'angular-calendar';
import { startOfDay, addHours, isSameDay, addMonths, subMonths, differenceInCalendarMonths } from 'date-fns';
import { FormsModule } from '@angular/forms';
import { format } from 'date-fns';
import { LOCALE_ID } from '@angular/core';
import { registerLocaleData } from '@angular/common';
import localeEs from '@angular/common/locales/es';
import { AppointmentsService } from '../services/appointments.service';
import { NotificationService, Cita } from '../services/notification.service';


registerLocaleData(localeEs);

@Component({
  selector: 'app-consultas',
  templateUrl: './consultas.component.html',
  styleUrl: './consultas.component.css',
  providers: [{ provide: LOCALE_ID, useValue: 'es' }]
})
export class ConsultasComponent implements AfterViewInit, OnInit {
  @ViewChild('monthView', { static: false }) monthViewRef!: ElementRef;

  userId: number = 0;
  isAdmin: boolean = false;
  userEmail = localStorage.getItem('email') || '';
  userName = localStorage.getItem('username') || '';
  adminEmail = 'adrianfernandezvento@gmail.com';

  citasVisibles: CalendarEvent[] = [];
  events: CalendarEvent[] = [];

  view: CalendarView = CalendarView.Month;
  CalendarView = CalendarView;
  viewDate: Date = new Date();
  selectedDate: Date | null = null;

  fechaMin = startOfDay(new Date());
  fechaMax = addMonths(this.fechaMin, 3);

  mostrarFormulario = false;
  nuevoNombre = '';
  nuevaHora = '';
  horasDisponibles: string[] = [];
  tieneCitaPendiente: boolean = false;


  constructor(private appointmentsService: AppointmentsService,
    private notification: NotificationService 
  ) { }

  ngOnInit(): void {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('Token no encontrado en localStorage');
      return;
    }

    this.appointmentsService.getUserRole(token).subscribe({
      next: ({ userId, rol }) => {
        this.userId = userId;
        console.log('Rol del usuario:', rol, 'User ID:', userId);
        
        this.isAdmin = rol === 1;

        this.appointmentsService.getAppointments(token).subscribe({
          next: ({ events }) => {
            const ahora = startOfDay(new Date());

            const eventosFuturos = events.filter(e => new Date(e.start) >= ahora);

            this.events = eventosFuturos.map(e => ({
              ...e,
              color: e.meta?.userId === userId
                ? { primary: '#0044cc', secondary: '#cce0ff' }
                : { primary: '#bde0fe', secondary: '#d1e8ff' }
            }));

            console.log('Eventos recibidos:', events);


            this.citasVisibles = this.events.filter(e => {
              if (this.isAdmin) return true;
              return e.meta?.userId === this.userId;
            });

            console.log('Citas visibles:', this.citasVisibles);
            


            if (!this.isAdmin) {
              const citasPendientes = this.events.filter(
                e => e.meta?.userId === userId && e.meta?.status === 0
              );
              this.tieneCitaPendiente = citasPendientes.length > 0;
            }
          },
          error: (err) => {
            console.error('Error al cargar las citas:', err);
          }
        });
      },
      error: (err) => {
        console.error('Error al obtener el rol:', err);
      }
    });
  }


  mesAnterior(): void {
    const anterior = subMonths(this.viewDate, 1);
    if (differenceInCalendarMonths(anterior, this.fechaMin) >= 0) {
      this.viewDate = anterior;
    }
  }

  mesSiguiente(): void {
    const siguiente = addMonths(this.viewDate, 1);
    if (differenceInCalendarMonths(this.fechaMax, siguiente) >= 0) {
      this.viewDate = siguiente;
    }
  }

  puedeRetroceder(): boolean {
    return differenceInCalendarMonths(this.viewDate, this.fechaMin) > 0;
  }

  puedeAvanzar(): boolean {
    return differenceInCalendarMonths(this.fechaMax, this.viewDate) > 0;
  }

  getEventsForDay(date: Date): CalendarEvent[] {
    return this.citasVisibles.filter(event => isSameDay(event.start, date));
  }

  getAllEventsForDay(date: Date): CalendarEvent[] {
    return this.events.filter(event => isSameDay(event.start, date));
  }

  onDayClicked(date: Date): void {
    const isSunday = date.getDay() === 0;
    const isPast = date < startOfDay(new Date());

    if (isSunday || isPast) return;

    this.selectedDate = date;
  }

  abrirFormulario(): void {
    if (!this.selectedDate) return;

    this.mostrarFormulario = true;
    this.nuevoNombre = '';
    this.nuevaHora = '';

    const dia = this.selectedDate.getDay();
    const inicio = [1, 2, 3, 4, 5].includes(dia) ? 7 : 9;
    const fin = [1, 2, 3, 4, 5].includes(dia) ? 21 : 13;

    const ocupadas = this.getAllEventsForDay(this.selectedDate).map(event =>
      new Date(event.start).getHours()
    );

    this.horasDisponibles = [];
    for (let h = inicio; h < fin; h++) {
      if (!ocupadas.includes(h)) {
        this.horasDisponibles.push(h.toString().padStart(2, '0') + ':00');
      }
    }
  }

  cerrarFormulario(): void {
    this.mostrarFormulario = false;
  }

  crearConsulta(): void {
    if (!this.selectedDate || !this.nuevoNombre || !this.nuevaHora) return;

    const hora = parseInt(this.nuevaHora.split(':')[0], 10);
    const start = new Date(this.selectedDate);
    start.setHours(hora, 0, 0, 0);

    const end = new Date(start);
    end.setHours(hora + 1);

    const token = localStorage.getItem('token');
    if (!token) {
      console.error('Token no encontrado');
      return;
    }


    const cita = {
      app_title: this.nuevoNombre,
      app_start: format(start, 'yyyy-MM-dd HH:mm:ss'),
      app_end: format(end, 'yyyy-MM-dd HH:mm:ss')
    };

    this.appointmentsService.createAppointment(token, cita).subscribe({
      next: () => {
        console.log('Cita creada correctamente');

        const citaNotificacion: Cita = {

          fechaISO: start.toISOString(),
          usuarioEmail: this.userEmail ,
          usuarioNombre: this.userName || undefined,
          administradorEmail: this.adminEmail
        };

        // 1) Email al usuario: "hemos recibido tu solicitud"
        this.notification.notifyUser('SOLICITADA', citaNotificacion).subscribe({
          next: () => console.log('Email solicitud (usuario) enviado'),
          error: e => console.error('Error email usuario', e)
        });

        // 2) Email al admin: "hay nueva solicitud"
        this.notification.notifyAdminNuevaSolicitud(citaNotificacion)?.subscribe({
          next: () => console.log('Email nueva solicitud (admin) enviado'),
          error: e => console.error('Error email admin', e)
        });

        // Recargar citas desde el servidor
        this.appointmentsService.getAppointments(token).subscribe({
          next: ({ events }) => {
            const ahora = startOfDay(new Date());

            const eventosFuturos = events.filter(e => new Date(e.start) >= ahora);

            this.events = eventosFuturos.map(e => ({
              ...e,
              color: e.meta?.userId === this.userId
                ? { primary: '#0044cc', secondary: '#cce0ff' }
                : { primary: '#bde0fe', secondary: '#d1e8ff' }
            }));

            this.citasVisibles = this.events.filter(e => {
              if (this.isAdmin) return true;
              return e.meta?.userId === this.userId;
            });

            if (!this.isAdmin) {
              const citasPendientes = this.events.filter(
                e => e.meta?.userId === this.userId && e.meta?.status === 0
              );
              this.tieneCitaPendiente = citasPendientes.length > 0;
            }

            this.cerrarFormulario();
          },
          error: err => {
            console.error('Error al recargar citas:', err);
          }
        });
      },
      error: err => {
        console.error('Error al crear cita:', err);
      }
    });
  }


  beforeMonthViewRender({ body }: { body: any[] }): void {
    body.forEach(day => {
      const date: Date = day.date;
      const isSunday = date.getDay() === 0;
      const isPast = date < startOfDay(new Date());

      if (isSunday || isPast) {
        day.backgroundColor = '#e0e0e0';
        day.cssClass = 'cal-disabled';
        return;
      }

      const dia = date.getDay();
      const inicio = [1, 2, 3, 4, 5].includes(dia) ? 7 : 9;
      const fin = [1, 2, 3, 4, 5].includes(dia) ? 21 : 13;
      const horasTotales = fin - inicio;

      const ocupadas = this.getAllEventsForDay(date).map(e => new Date(e.start).getHours());

      if (ocupadas.length === 0) {
        // sin color
      } else if (ocupadas.length >= horasTotales) {
        day.backgroundColor = '#fddcdc';
      } else {
        day.backgroundColor = '#fff4c2';
      }
    });
  }

  alternarFormulario(): void {
    this.mostrarFormulario ? this.cerrarFormulario() : this.abrirFormulario();
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      const container = document.querySelector('.cal-month-view');
      if (!container) return;

      const handleHover = (event: Event) => {
        const target = event.target as HTMLElement;
        if (target.classList.contains('cal-event')) {
          const fechaOriginal = this.viewDate;
          this.viewDate = new Date(this.viewDate);
          setTimeout(() => (this.viewDate = fechaOriginal), 0);
        }
      };

      container.addEventListener('mouseenter', handleHover, true);
      container.addEventListener('mouseleave', handleHover, true);
    }, 0);
  }
}
