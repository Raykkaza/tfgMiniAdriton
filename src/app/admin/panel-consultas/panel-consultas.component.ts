import { Component, OnInit } from '@angular/core';
import { AppointmentsService } from '../../services/appointments.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';

declare var $: any;

@Component({
  selector: 'app-panel-consultas',
  templateUrl: './panel-consultas.component.html',
  styleUrls: ['./panel-consultas.component.css']
})
export class PanelConsultasComponent implements OnInit {
  citas: any[] = [];
  citaEditando: any = {};
  usuarios: Record<number, string> = {};
  horasDisponibles: string[] = [];
  horasFinDisponibles: string[] = [];


  constructor(
    private appointmentsService: AppointmentsService,
    private http: HttpClient
  ) { }

  ngOnInit(): void {
    this.cargarDatos();
  }

  cargarDatos(): void {
    const token = localStorage.getItem('token');
    if (!token) return;

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    this.http.get<any[]>('https://miniadritonff.com/api/get_users.php', { headers }).subscribe({
      next: (res) => {
        res.forEach(u => this.usuarios[u.user_id] = u.username);

        this.appointmentsService.getAppointments(token).subscribe({
          next: (res) => {
            this.citas = res.events.map((ev: any) => ({
              app_id: ev.meta.app_id,
              app_title: ev.title,
              app_start: ev.start,
              app_end: ev.end,
              user_id: ev.meta.userId,
              status: ev.meta.status,
              username: this.usuarios[ev.meta.userId] || `ID ${ev.meta.userId}`
            }));

            // ⚠️ Destruir solo si ya existe una DataTable
            if ($.fn.DataTable.isDataTable('#consultasTable')) {
              $('#consultasTable').DataTable().destroy();
            }

            // Esperar al DOM para que Angular pinte la tabla actualizada
            setTimeout(() => {
              $('#consultasTable').DataTable({
                language: {
                  url: '//cdn.datatables.net/plug-ins/1.10.24/i18n/Spanish.json'
                },
                pageLength: 10,
                lengthChange: true,
                ordering: true,
                searching: true,
                info: true
              });
            }, 50); // ⏱ Ajusta si ves que sigue fallando
          }
        });
      }
    });
  }






  aprobarCita(app_id: number): void {
    const token = localStorage.getItem('token');
    if (!token) return;

    this.appointmentsService.approveAppointment(token, app_id).subscribe(() => {
      const cita = this.citas.find(c => c.app_id === app_id);
      if (cita) cita.status = 1;
    });
  }

  denegarCita(app_id: number): void {
    const token = localStorage.getItem('token');
    if (!token) return;

    this.appointmentsService.deleteAppointment(token, app_id).subscribe(() => {
      this.citas = this.citas.filter(c => c.app_id !== app_id);
    });
  }

  editarCita(cita: any): void {
    const inicio = new Date(cita.app_start);
    const fin = new Date(cita.app_end);

    this.citaEditando = {
      ...cita,
      fecha: inicio.toISOString().split('T')[0],
      horaInicio: inicio.toTimeString().slice(0, 5),
      horaFin: fin.toTimeString().slice(0, 5)
    };

    // Generar horas disponibles (por ejemplo: de 07:00 a 21:00)
    const horas: string[] = [];
    for (let h = 7; h < 22; h++) {
      const hora = `${h.toString().padStart(2, '0')}:00`;
      horas.push(hora);
    }

    // Filtramos horas ocupadas de otras citas en ese mismo día
    const ocupadas = this.citas
      .filter(c => c.app_id !== cita.app_id && c.app_start.toISOString().startsWith(this.citaEditando.fecha))
      .flatMap(c => {
        const start = new Date(c.app_start);
        const end = new Date(c.app_end);
        const bloques: string[] = [];

        while (start < end) {
          const hora = start.toTimeString().slice(0, 5);
          bloques.push(hora);
          start.setMinutes(start.getMinutes() + 30);
        }

        return bloques;
      });

    this.horasDisponibles = horas.filter(h => !ocupadas.includes(h));
    this.onHoraInicioChange();

    const modal = new (window as any).bootstrap.Modal(document.getElementById('editarModal'));
    modal.show();
  }

  guardarCambios(): void {
    const token = localStorage.getItem('token');
    if (!token) return;

    const { app_id, app_title, fecha, horaInicio, horaFin } = this.citaEditando;
    const app_start = `${fecha}T${horaInicio}:00`;
    const app_end = `${fecha}T${horaFin}:00`;

    this.appointmentsService.editAppointment(token, {
      app_id,
      app_title,
      app_start,
      app_end
    }).subscribe(() => {
      // Ocultar modal y recargar tabla
      const modal = (window as any).bootstrap.Modal.getInstance(document.getElementById('editarModal'));
      modal.hide();

      this.cargarDatos(); // actualiza todo
    });
  }

  eliminarCita(app_id: number): void {
    this.denegarCita(app_id);
  }
  onHoraInicioChange(): void {
    const idx = this.horasDisponibles.indexOf(this.citaEditando.horaInicio);
    this.horasFinDisponibles = this.horasDisponibles.slice(idx + 1);
    this.citaEditando.horaFin = ''; // Limpiar selección anterior
  }


  
}
