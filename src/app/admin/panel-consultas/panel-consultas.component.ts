import { Component, OnInit } from '@angular/core';
import { AppointmentsService } from '../../services/appointments.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router, ActivatedRoute } from '@angular/router';
import { NotificationService, Cita } from '../../services/notification.service';

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
  usuariosEmail: Record<number, string> = {};
  horasDisponibles: string[] = [];
  horasFinDisponibles: string[] = [];
  adminEmail = 'adrianfernandezvento@gmail.com';

  // === CREAR CITA ===
  nuevaCita: {
    user_id: number | null,
    app_title: string,
    fecha: string,        // YYYY-MM-DD
    horaInicio: string,   // HH:mm
    horaFin: string       // HH:mm
  } = { user_id: null, app_title: '', fecha: '', horaInicio: '', horaFin: '' };

  horasDisponiblesNueva: string[] = [];
  horasFinDisponiblesNueva: string[] = [];

  constructor(
    private appointmentsService: AppointmentsService,
    private http: HttpClient,
    private router: Router,
    private route: ActivatedRoute,
    private notification: NotificationService
  ) { }

  ngOnInit(): void {
    console.log("hola!");
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
        res.forEach(u => this.usuariosEmail[u.user_id] = u.email);

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
                  url: 'https://cdn.datatables.net/plug-ins/1.10.24/i18n/Spanish.json'
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

    // 1) Localiza la cita en memoria (para armar el email)
    const cita = this.citas.find(c => c.app_id === app_id);
    if (!cita) return;

    // 2) Llama a tu backend para aprobar
    this.appointmentsService.approveAppointment(token, app_id).subscribe(() => {
      // 3) Refresca estado en la UI
      cita.status = 1;

      // 4) Construye el objeto "Cita" para notificaciones
      const citaNotif: Cita = {
        fechaISO: new Date(cita.app_start).toISOString(),
        usuarioEmail: this.usuariosEmail[cita.user_id],   // requiere que lo tengamos cargado
        usuarioNombre: cita.username,
        administradorEmail: this.adminEmail
      };

      // 5) Envía email al usuario: ACEPTADA
      this.notification.notifyUser('ACEPTADA', citaNotif).subscribe({
        next: () => console.log('Email ACEPTADA enviado'),
        error: e => console.error('Error email ACEPTADA', e)
      });
    });
  }

  denegarCita(app_id: number): void {
    const token = localStorage.getItem('token');
    if (!token) return;

    // 1) Copia de la cita para armar el email
    const cita = this.citas.find(c => c.app_id === app_id);
    if (!cita) return;

    const citaNotif: Cita = {
      fechaISO: new Date(cita.app_start).toISOString(),
      usuarioEmail: this.usuariosEmail[cita.user_id],
      usuarioNombre: cita.username,
      administradorEmail: this.adminEmail
    };

    // 2) Envía email al usuario: RECHAZADA
    this.notification.notifyUser('RECHAZADA', citaNotif).subscribe({
      next: () => console.log('Email RECHAZADA enviado'),
      error: e => console.error('Error email RECHAZADA', e)
    });

    // 3) Elimina en backend y refresca tabla
    this.appointmentsService.deleteAppointment(token, app_id).subscribe(() => {
      this.citas = this.citas.filter(c => c.app_id !== app_id);
      this.reloadComponent(); // ya lo tenías
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
      this.reloadComponent(); // 🔄 recarga completa del componente
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

  reloadComponent(): void {
    const currentUrl = this.router.url;
    setTimeout(() => {
      this.router.navigateByUrl('/refresh', { skipLocationChange: true }).then(() => {
        this.router.navigate([currentUrl]);
      });
    }, 150);
  }

  // ==============================
  //        NUEVA CITA (ADD)
  // ==============================

  abrirCrearCita(): void {
    // reset del formulario
    this.nuevaCita = { user_id: null, app_title: '', fecha: '', horaInicio: '', horaFin: '' };
    this.horasDisponiblesNueva = this.generarHorasBase();
    this.horasFinDisponiblesNueva = [];

    const modal = new (window as any).bootstrap.Modal(document.getElementById('crearModal'));
    modal.show();
  }

  onFechaNuevaChange(): void {
    if (!this.nuevaCita.fecha) {
      this.horasDisponiblesNueva = this.generarHorasBase();
      this.horasFinDisponiblesNueva = [];
      return;
    }

    // horas ocupadas en esa fecha (usamos split('T')[0] para comparar la fecha)
    const ocupadas = this.citas
      .filter(c => {
        const fechaCita = new Date(c.app_start).toISOString().split('T')[0];
        return fechaCita === this.nuevaCita.fecha;
      })
      .flatMap(c => {
        const start = new Date(c.app_start);
        const end = new Date(c.app_end);
        const bloques: string[] = [];
        while (start < end) {
          const h = start.toTimeString().slice(0, 5);
          bloques.push(h);
          start.setMinutes(start.getMinutes() + 30);
        }
        return bloques;
      });

    const base = this.generarHorasBase();
    this.horasDisponiblesNueva = base.filter(h => !ocupadas.includes(h));

    // limpiar selección y recomputar fin
    this.nuevaCita.horaInicio = '';
    this.nuevaCita.horaFin = '';
    this.horasFinDisponiblesNueva = [];
  }

  onHoraInicioNuevaChange(): void {
    const idx = this.horasDisponiblesNueva.indexOf(this.nuevaCita.horaInicio);
    this.horasFinDisponiblesNueva = this.horasDisponiblesNueva.slice(idx + 1);
    this.nuevaCita.horaFin = '';
  }

  private generarHorasBase(): string[] {
    const horas: string[] = [];
    for (let h = 7; h < 22; h++) {
      horas.push(`${h.toString().padStart(2, '0')}:00`);
    }
    return horas;
  }

  crearCita(): void {
    const token = localStorage.getItem('token');
    if (!token) return;

    const { user_id, app_title, fecha, horaInicio, horaFin } = this.nuevaCita;
    const app_start = `${fecha}T${horaInicio}:00`;
    const app_end = `${fecha}T${horaFin}:00`;

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    const body = {
      user_id,
      app_title,
      app_start,
      app_end
    };

    this.http.post('https://miniadritonff.com/api/create_appointment.php', body, { headers })
      .subscribe({
        next: () => {
          const modal = (window as any).bootstrap.Modal.getInstance(document.getElementById('crearModal'));
          modal?.hide();

          // recarga datos y DataTable
          this.cargarDatos();
          this.reloadComponent(); // ya lo tienes implementado
        },
        error: (e) => {
          console.error('Error al crear la cita', e);
          alert('No se pudo crear la cita. Revisa los datos y vuelve a intentarlo.');
        }
      });
  }
}
