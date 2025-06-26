import { Component } from '@angular/core';
import { CalendarEvent } from 'angular-calendar';
import { CalendarView } from 'angular-calendar';
import { startOfDay, addHours, isSameDay } from 'date-fns';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-consultas',
  templateUrl: './consultas.component.html',
  styleUrl: './consultas.component.css'
})
export class ConsultasComponent {
  view: CalendarView = CalendarView.Month;
  CalendarView = CalendarView;

  viewDate: Date = new Date();
  selectedDate: Date | null = null;

  events: CalendarEvent[] = [
    {
      start: addHours(startOfDay(new Date()), 9),
      end: addHours(startOfDay(new Date()), 10),
      title: 'Consulta con Ana'
    },
    {
      start: addHours(startOfDay(new Date()), 11),
      end: addHours(startOfDay(new Date()), 12),
      title: 'Consulta con Luis'
    },
    {
      start: addHours(startOfDay(new Date()), 15),
      end: addHours(startOfDay(new Date()), 16),
      title: 'Consulta con Marta'
    },
    {
      start: addHours(startOfDay(new Date(new Date().setDate(new Date().getDate() + 1))), 10),
      end: addHours(startOfDay(new Date(new Date().setDate(new Date().getDate() + 1))), 11),
      title: 'Consulta con Pedro'
    }
  ];

  // Devuelve las citas de un día concreto
  getEventsForDay(date: Date): CalendarEvent[] {
    return this.events.filter(event => isSameDay(event.start, date));
  }

  // Al hacer clic en un día, se actualiza el día seleccionado
  onDayClicked(date: Date): void {
    this.selectedDate = date;
  }

  mostrarFormulario = false;
  nuevoNombre = '';
  nuevaHora = '';
  horasDisponibles: string[] = [];

  abrirFormulario(): void {
    console.log('Abriendo formulario…'); // <- AÑADE ESTO
    console.log(this.mostrarFormulario);
    
    if (!this.selectedDate) return;

    this.mostrarFormulario = true;
    this.nuevoNombre = '';
    this.nuevaHora = '';

    const dia = this.selectedDate.getDay(); // 0=Dom, 1=Lun...
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
  alternarFormulario(): void {
    if (this.mostrarFormulario) {
      this.cerrarFormulario();
    } else {
      this.abrirFormulario();
    }
  }
  

}
