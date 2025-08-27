import { Injectable } from '@angular/core';
import { EmailService } from './email.service';
import { Observable } from 'rxjs';

export type NotificationKind = 'SOLICITADA' | 'ACEPTADA' | 'RECHAZADA';

export interface Cita {
  fechaISO: string;               // fecha/hora de la cita
  usuarioEmail: string;           // destino del usuario
  usuarioNombre?: string;
  administradorEmail?: string;    // para avisar al admin cuando hay solicitud
}

/** === NUEVO: Tipos para notificaciones de suscripción === */
export type SubNotificationKind = 'SUB_SOLICITADA' | 'SUB_ACEPTADA' | 'SUB_RECHAZADA';

export interface SubSolicitud {
  usuarioEmail: string;           // email del usuario
  usuarioNombre?: string;         // opcional
  administradorEmail?: string;    // para avisar al admin al crear solicitud

  subTypeNombre: string;          // "Basica", "Atleta", "Antropometria", etc.
  periodoLabel: string;           // "Mensual", "Trimestral" o "Pago único"
  totalEuros: number;             // total calculado mostrado en el checkout
  endDateISO: string;             // fecha de fin (YYYY-MM-DD)
  concepto: string;               // texto que pedimos usar en la transferencia
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  constructor(private email: EmailService) { }

  // ----------------- utilidades comunes -----------------
  private formatFecha(iso: string) {
    const d = new Date(iso);
    return new Intl.DateTimeFormat('es-ES', {
      dateStyle: 'long',
      timeStyle: 'short'
    }).format(d);
  }

  /** Para fechas de solo día (p.ej. endDate de la suscripción) */
  private formatFechaCorta(isoDate: string) {
    const d = new Date(isoDate);
    return new Intl.DateTimeFormat('es-ES', { dateStyle: 'long' }).format(d);
  }

  private formatCurrencyEUR(amount: number) {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(amount);
  }

  // ----------------- Citas (tu código tal cual) -----------------
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

  /** Notifica a un administrador cuando entra una solicitud nueva */
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

  // ----------------- Suscripciones -----------------
  private buildSubUserMessage(kind: SubNotificationKind, s: SubSolicitud) {
    const nombre = s.usuarioNombre ? ` ${s.usuarioNombre}` : '';
    const fin = this.formatFechaCorta(s.endDateISO);
    const total = this.formatCurrencyEUR(s.totalEuros);

    if (kind === 'SUB_SOLICITADA') {
      const subject = `Hemos recibido tu solicitud de suscripción`;
      const text =
        `Hola${nombre},\n\n` +
        `Hemos recibido tu solicitud para la suscripción "${s.subTypeNombre}" (${s.periodoLabel}).\n` +
        `Importe: ${total}.\n` +
        `Fecha de fin estimada: ${fin}.\n\n` +
        `Te avisaremos cuando sea aceptada o rechazada.\n\n` +
        `Gracias,\nMiniAdritonFF`;
      const html =
        `<p>Hola${nombre},</p>
         <p>Hemos recibido tu solicitud para la suscripción <strong>"${s.subTypeNombre}"</strong> (${s.periodoLabel}).</p>
         <ul>
           <li><strong>Importe:</strong> ${total}</li>
           <li><strong>Fecha de fin estimada:</strong> ${fin}</li>
         </ul>
         <p><strong>IMPORTANTE:</strong> usa este concepto en tu transferencia:<br>
         <code>${s.concepto}</code></p>
         <p>Te avisaremos cuando sea aceptada o rechazada.</p>
         <p>Gracias,<br>MiniAdritonFF</p>`;
      return { subject, text, html };
    }

    if (kind === 'SUB_ACEPTADA') {
      const subject = `Tu suscripción ha sido aceptada`;
      const text =
        `¡Buenas${nombre}! Tu suscripción "${s.subTypeNombre}" (${s.periodoLabel}) ha sido ACEPTADA.\n` +
        `Importe: ${total}.\n` +
        `Vigente hasta: ${fin}.\n\n` +
        `Gracias por tu confianza.\nMiniAdritonFF`;
      const html =
        `<p>¡Buenas${nombre}! Tu suscripción <strong>"${s.subTypeNombre}"</strong> (${s.periodoLabel}) ha sido ` +
        `<span style="color:green;font-weight:700">ACEPTADA</span>.</p>
         <ul>
           <li><strong>Importe:</strong> ${total}</li>
           <li><strong>Vigente hasta:</strong> ${fin}</li>
         </ul>
         <p>Gracias por tu confianza.<br>MiniAdritonFF</p>`;
      return { subject, text, html };
    }

    // SUB_RECHAZADA
    const subject = `Tu suscripción ha sido rechazada`;
    const text =
      `Hola${nombre}, tu suscripción "${s.subTypeNombre}" (${s.periodoLabel}) ha sido RECHAZADA.\n` +
      `Seguramente se deba a un problema con tu transferencia, revisa los datos y vuelve a intentarlo o contacta con soporte.\n\nMiniAdritonFF`;
    const html =
      `<p>Hola${nombre}, tu suscripción <strong>"${s.subTypeNombre}"</strong> (${s.periodoLabel}) ha sido ` +
      `<span style="color:#b00020;font-weight:700">RECHAZADA</span>.</p>
       <p>Seguramente se deba a un problema con tu transferencia, revisa los datos y vuelve a intentarlo o contacta con soporte.</p>
       <p>MiniAdritonFF</p>`;
    return { subject, text, html };
  }

  /** Usuario: notificación de suscripción (solicitada/aceptada/rechazada) */
  notifyUserSubscription(kind: SubNotificationKind, s: SubSolicitud): Observable<{ success: boolean; error?: string }> {
    const msg = this.buildSubUserMessage(kind, s);
    return this.email.send({
      to: s.usuarioEmail,
      subject: msg.subject,
      text: msg.text,
      html: msg.html
    });
  }

  /** Admin: aviso cuando entra una solicitud de suscripción */
  notifyAdminNuevaSubSolicitud(s: SubSolicitud): Observable<{ success: boolean; error?: string }> | undefined {
    if (!s.administradorEmail) return;
    const fin = this.formatFechaCorta(s.endDateISO);
    const total = this.formatCurrencyEUR(s.totalEuros);

    const subject = `Nueva solicitud de suscripción`;
    const text =
      `Nueva solicitud de suscripción:\n` +
      `Usuario: ${s.usuarioEmail}\n` +
      `Tipo: ${s.subTypeNombre}\n` +
      `Periodo: ${s.periodoLabel}\n` +
      `Total: ${total}\n` +
      `Fin: ${fin}\n` +
      `Concepto: ${s.concepto}`;
    const html =
      `<p><strong>Nueva solicitud de suscripción</strong></p>
       <ul>
         <li><strong>Usuario:</strong> ${s.usuarioEmail}</li>
         <li><strong>Tipo:</strong> ${s.subTypeNombre}</li>
         <li><strong>Periodo:</strong> ${s.periodoLabel}</li>
         <li><strong>Total:</strong> ${total}</li>
         <li><strong>Fin:</strong> ${fin}</li>
         <li><strong>Concepto:</strong> <code>${s.concepto}</code></li>
       </ul>`;

    return this.email.send({
      to: s.administradorEmail,
      subject,
      text,
      html
    });
  }
}
