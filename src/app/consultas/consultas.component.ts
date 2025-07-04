import { Component, OnInit } from '@angular/core';
import { AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { CalendarEvent } from 'angular-calendar';
import { CalendarView } from 'angular-calendar';
import { startOfDay, addHours, isSameDay, addMonths, subMonths, differenceInCalendarMonths } from 'date-fns';
import { FormsModule } from '@angular/forms';
import { LOCALE_ID } from '@angular/core';
import { registerLocaleData } from '@angular/common';
import localeEs from '@angular/common/locales/es';
import { AppointmentsService } from '../services/appointments.service'; // <-- NUEVO

registerLocaleData(localeEs);


@Component({
  selector: 'app-consultas',
  templateUrl: './consultas.component.html',
  styleUrl: './consultas.component.css',
  providers: [{ provide: LOCALE_ID, useValue: 'es' }]
})
export class ConsultasComponent implements AfterViewInit, OnInit { // <-- Añadido OnInit
  @ViewChild('monthView', { static: false }) monthViewRef!: ElementRef;
  view: CalendarView = CalendarView.Month;
  CalendarView = CalendarView;

  viewDate: Date = new Date();
  selectedDate: Date | null = null;

  fechaMin = startOfDay(new Date());
  fechaMax = addMonths(this.fechaMin, 3);

  constructor(private appointmentsService: AppointmentsService) { } // <-- NUEVO

  ngOnInit(): void { // <-- NUEVO
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('Token no encontrado en localStorage');
      return;
    }

    this.appointmentsService.getAppointments(token).subscribe({
      next: (citas) => {
        this.events = citas;
      },
      error: (err) => {
        console.error('Error al cargar las citas:', err);
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

  events: CalendarEvent[] = []; // <-- Inicializado vacío

  // Devuelve las citas de un día concreto
  getEventsForDay(date: Date): CalendarEvent[] {
    return this.events.filter(event => isSameDay(event.start, date));
  }

  // Al hacer clic en un día, se actualiza el día seleccionado
  onDayClicked(date: Date): void {
    const isSunday = date.getDay() === 0;
    const isPast = date < startOfDay(new Date());

    if (isSunday || isPast) return;

    this.selectedDate = date;
  }

  mostrarFormulario = false;
  nuevoNombre = '';
  nuevaHora = '';
  horasDisponibles: string[] = [];

  abrirFormulario(): void {
    console.log('Abriendo formulario…');
    console.log(this.mostrarFormulario);

    if (!this.selectedDate) return;

    this.mostrarFormulario = true;
    this.nuevoNombre = '';
    this.nuevaHora = '';

    const dia = this.selectedDate.getDay();
    const inicio = [1, 2, 3, 4, 5].includes(dia) ? 10 : 16;
    const fin = [1, 2, 3, 4, 5].includes(dia) ? 18 : 20;

    const ocupadas = this.getEventsForDay(this.selectedDate).map(event =>
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

    this.events = [
      ...this.events,
      {
        start,
        end,
        title: this.nuevoNombre
      }
    ];

    this.cerrarFormulario();
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
      const inicio = [1, 2, 3, 4, 5].includes(dia) ? 10 : 16;
      const fin = [1, 2, 3, 4, 5].includes(dia) ? 18 : 20;
      const horasTotales = fin - inicio;

      const ocupadas = this.getEventsForDay(date).map(e => new Date(e.start).getHours());

      if (ocupadas.length === 0) {
      } else if (ocupadas.length >= horasTotales) {
        day.backgroundColor = '#fddcdc';
      } else {
        day.backgroundColor = '#fff4c2';
      }
    });
  }

  alternarFormulario(): void {
    if (this.mostrarFormulario) {
      this.cerrarFormulario();
    } else {
      this.abrirFormulario();
    }
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
