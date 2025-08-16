import { Injectable } from '@angular/core';
import { EmailService } from './email.service';
import { Observable } from 'rxjs';

export type NotificationKind = 'SOLICITADA' | 'ACEPTADA' | 'RECHAZADA';

export interface Cita {
  fechaISO: string;         // ej: "2025-08-15T16:00:00Z"
  usuarioEmail: string;     // destino del usuario
  usuarioNombre?: string;
  administradorEmail?: string; // para avisar al admin cuando hay solicitud
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  constructor(private email: EmailService) { }

  private formatFecha(iso: string) {
    // Ajusta a tu gusto; ahora mismo ES-es con fecha larga y hora corta
    const d = new Date(iso);
    return new Intl.DateTimeFormat('es-ES', {
      dateStyle: 'long',
      timeStyle: 'short'
    }).format(d);
  }

  private buildUserMessage(kind: NotificationKind, cita: Cita) {
    const fecha = this.formatFecha(cita.fechaISO);
    const nombre = cita.usuarioNombre ? ` ${cita.usuarioNombre}` : '';

    if (kind === 'SOLICITADA') {
      const subject = `Hemos recibido tu solicitud de consulta`;
      const text =
        `Hola${nombre},\n\n` +
        `Hemos recibido tu solicitud para la consulta del ${fecha}. ` +
        `Te avisaremos cuando sea aceptada o rechazada.\n\n` +
        `Gracias,\nMiniAdritonFF`;
      const html =
        `<p>Hola${nombre},</p>
       <p>Hemos recibido tu solicitud para la consulta del <strong>${fecha}</strong>.
       Te avisaremos cuando sea aceptada o rechazada.</p>
       <p>Gracias,<br>MiniAdritonFF</p>`;
      return { subject, text, html };
    }

    if (kind === 'ACEPTADA') {
      const subject = `Tu consulta ha sido aceptada`;
      const text =
        `¡Buenas${nombre}! Tu consulta del ${fecha} ha sido ACEPTADA.\n` +
        `Nos vemos en la fecha indicada.\n\nMiniAdritonFF`;
      const html =
        `<p>¡Buenas${nombre}! Tu consulta del <strong>${fecha}</strong> ha sido ` +
        `<span style="color:green;font-weight:700">ACEPTADA</span>.</p>
       <p>Nos vemos en la fecha indicada.</p>
       <p>MiniAdritonFF</p>`;
      return { subject, text, html };
    }

    // RECHAZADA
    const subject = `Tu consulta ha sido rechazada`;
    const text =
      `Hola${nombre}, tu consulta del ${fecha} ha sido RECHAZADA.\n` +
      `Si lo deseas, puedes solicitar una nueva fecha.\n\nMiniAdritonFF`;
    const html =
      `<p>Hola${nombre}, tu consulta del <strong>${fecha}</strong> ha sido ` +
      `<span style="color:#b00020;font-weight:700">RECHAZADA</span>.</p>
     <p>Si lo deseas, puedes solicitar una nueva fecha.</p>
     <p>MiniAdritonFF</p>`;
    return { subject, text, html };
  }


  /** Notifica al usuario final (solicitada/aceptada/rechazada) */
  notifyUser(kind: NotificationKind, cita: Cita): Observable<{ success: boolean; error?: string }> {
    const msg = this.buildUserMessage(kind, cita);
    return this.email.send({
      to: cita.usuarioEmail,
      subject: msg.subject,
      text: msg.text,
      html: msg.html
    });
  }

  /** (Opcional) Notifica a un administrador cuando entra una solicitud nueva */
  notifyAdminNuevaSolicitud(cita: Cita): Observable<{ success: boolean; error?: string }> | undefined {
    if (!cita.administradorEmail) return;
    const fecha = this.formatFecha(cita.fechaISO);
    const subject = `Nueva solicitud de consulta`;
    const text = `Nueva solicitud para el ${fecha} del usuario ${cita.usuarioEmail}.`;
    const html = `<p>Nueva solicitud para el <strong>${fecha}</strong> del usuario <strong>${cita.usuarioEmail}</strong>.</p>`;

    return this.email.send({
      to: cita.administradorEmail,
      subject,
      text,
      html
    });
  }
}
