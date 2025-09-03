import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router, ActivatedRoute } from '@angular/router';
import { NotificationService, SubSolicitud } from '../../services/notification.service';

declare var $: any;

type SubRow = {
  sub_id: number;
  user_id: number;
  username?: string;
  email?: string;
  sub_status: number;          // 0 pendiente/inactiva, 1 activa
  sub_end_date: string;        // 'YYYY-MM-DD'
  sub_type_id: number | null;
  sub_type?: string | null;    // nombre
  sub_price?: number | null;   // €
};

type UsersMap = Record<number, string>;
type EmailsMap = Record<number, string>;
type SubTypeOpt = { id: number; label: string; price?: number | null };

@Component({
  selector: 'app-panel-subs',
  templateUrl: './panel-subs.component.html',
  styleUrls: ['./panel-subs.component.css']
})
export class PanelSubsComponent implements OnInit {
  subs: SubRow[] = [];
  subEditando: any = {};
  usuarios: UsersMap = {};
  usuariosEmail: EmailsMap = {};
  subTypes: SubTypeOpt[] = [];
  adminEmail = 'adrianfernandezvento@gmail.com';

  modoCrear = false; // controla si el modal está en modo crear o editar

  constructor(
    private http: HttpClient,
    private router: Router,
    private route: ActivatedRoute,
    private notification: NotificationService
  ) { }

  ngOnInit(): void {
    this.cargarDatos();
  }

  private authHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({ 'Authorization': `Bearer ${token}` });
  }

  private buildSubTypesFromRows(rows: SubRow[]): SubTypeOpt[] {
    const map = new Map<number, SubTypeOpt>();
    for (const r of rows) {
      if (r.sub_type_id != null) {
        const exist = map.get(r.sub_type_id);
        if (!exist) {
          map.set(r.sub_type_id, { id: r.sub_type_id, label: r.sub_type ?? `Tipo #${r.sub_type_id}`, price: r.sub_price ?? null });
        } else {
          if (exist.label.startsWith('Tipo #') && r.sub_type) exist.label = r.sub_type;
          if (exist.price == null && r.sub_price != null) exist.price = r.sub_price;
        }
      }
    }
    return Array.from(map.values()).sort((a, b) => a.id - b.id);
  }

  cargarDatos(): void {
    const headers = this.authHeaders();

    // 1) Usuarios
    this.http.get<any[]>('https://miniadritonff.com/api/get_users.php', { headers }).subscribe({
      next: (res) => {
        res.forEach(u => this.usuarios[u.user_id] = u.username);
        res.forEach(u => this.usuariosEmail[u.user_id] = u.email);

        // 2) Suscripciones
        this.http.get<any>('https://miniadritonff.com/api/get_subscriptions.php', { headers })
          .subscribe({
            next: (raw) => {
              const list: any[] = Array.isArray(raw) ? raw : (raw?.subscriptions ?? []);
              // Saneamos por si el endpoint antiguo tenía la clave sub_type duplicada
              this.subs = list.map((r: any) => {
                let sub_type = r.sub_type;
                let sub_price = r.sub_price;
                if (typeof sub_type === 'number' && sub_price == null) {
                  sub_price = sub_type; sub_type = null;
                }
                return {
                  sub_id: Number(r.sub_id),
                  user_id: Number(r.user_id),
                  username: r.username ?? this.usuarios[r.user_id] ?? `ID ${r.user_id}`,
                  email: r.email ?? this.usuariosEmail[r.user_id] ?? '',
                  sub_status: Number(r.sub_status),
                  sub_end_date: r.sub_end_date,
                  sub_type_id: r.sub_type_id !== null && r.sub_type_id !== undefined ? Number(r.sub_type_id) : null,
                  sub_type: sub_type ?? null,
                  sub_price: sub_price != null ? Number(sub_price) : null
                } as SubRow;
              });

              this.subTypes = this.buildSubTypesFromRows(this.subs);

              // Reinit DataTable
              if ($.fn.DataTable.isDataTable('#subsTable')) {
                $('#subsTable').DataTable().destroy();
              }
              setTimeout(() => {
                $('#subsTable').DataTable({
                  language: { url: 'https://cdn.datatables.net/plug-ins/1.10.24/i18n/Spanish.json' },
                  pageLength: 10,
                  lengthChange: true,
                  ordering: true,
                  searching: true,
                  info: true
                });
              }, 50);
            },
            error: (e) => console.error('Error cargando suscripciones', e)
          });
      },
      error: (e) => console.error('Error cargando usuarios', e)
    });
  }

  // ======= CREAR (ADMIN) =======
  nuevaSub(): void {
    this.modoCrear = true;
    this.subEditando = {
      sub_id: 0,
      user_id: null,
      sub_end_date: new Date().toISOString().slice(0, 10),
      sub_type_id: this.subTypes.length ? this.subTypes[0].id : null,
      sub_status: 1 // por defecto activa (admin)
    };
    const modal = new (window as any).bootstrap.Modal(document.getElementById('editarSubModal'));
    modal.show();
  }

  // ======= APROBAR / DENEGAR =======
  aprobarSub(sub_id: number): void {
    const headers = this.authHeaders();
    const sub = this.subs.find(s => s.sub_id === sub_id);
    if (!sub) return;

    this.http.post<any>('https://miniadritonff.com/api/approve_subscription.php', { sub_id }, { headers })
      .subscribe({
        next: () => {
          sub.sub_status = 1;

          // Notificación de aceptación
          const payload = this.buildSubSolicitud(sub);
          this.notification.notifyUserSubscription('SUB_ACEPTADA', payload).subscribe({
            next: () => console.log('Email SUB_ACEPTADA enviado'),
            error: e => console.error('Error email SUB_ACEPTADA', e)
          });

          // 🔄 recarga
          this.cargarDatos();
          this.reloadComponent();
        },
        error: (e) => console.error('Error aprobando suscripción', e)
      });
  }

  denegarSub(sub_id: number): void {
    const headers = this.authHeaders();
    const sub = this.subs.find(s => s.sub_id === sub_id);
    if (!sub) return;

    // Notificación de rechazo (antes de borrar)
    const payload = this.buildSubSolicitud(sub);
    this.notification.notifyUserSubscription('SUB_RECHAZADA', payload).subscribe({
      next: () => console.log('Email SUB_RECHAZADA enviado'),
      error: e => console.error('Error email SUB_RECHAZADA', e)
    });

    this.http.post<any>('https://miniadritonff.com/api/delete_subscription.php', { sub_id }, { headers })
      .subscribe({
        next: () => {
          this.subs = this.subs.filter(s => s.sub_id !== sub_id);

          // 🔄 recarga
          if ($.fn.DataTable.isDataTable('#subsTable')) {
            $('#subsTable').DataTable().destroy();
          }
          setTimeout(() => {
            $('#subsTable').DataTable({
              language: { url: 'https://cdn.datatables.net/plug-ins/1.10.24/i18n/Spanish.json' },
              pageLength: 10
            });
          }, 50);
          this.cargarDatos();
          this.reloadComponent();
        },
        error: (e) => console.error('Error eliminando suscripción', e)
      });
  }

  // ======= EDITAR =======
  editarSub(s: SubRow): void {
    this.modoCrear = false;
    this.subEditando = {
      sub_id: s.sub_id,
      user_id: s.user_id,
      sub_end_date: s.sub_end_date,
      sub_status: s.sub_status,
      sub_type_id: s.sub_type_id
    };
    const modal = new (window as any).bootstrap.Modal(document.getElementById('editarSubModal'));
    modal.show();
  }

  guardarCambios(): void {
    const headers = this.authHeaders();
    const modal = (window as any).bootstrap.Modal.getInstance(document.getElementById('editarSubModal'));

    if (this.modoCrear) {
      // ======= CREAR (ADMIN) =======
      const payload: any = {
        user_id: Number(this.subEditando.user_id),
        sub_type_id: this.subEditando.sub_type_id === null ? null : Number(this.subEditando.sub_type_id),
        sub_end_date: this.subEditando.sub_end_date,
        sub_status: Number(this.subEditando.sub_status) // 0/1 (opcional, por defecto 1 en backend)
      };

      this.http.post<any>('https://miniadritonff.com/api/create_subscription_admin.php', payload, { headers })
        .subscribe({
          next: (resp) => {
            modal.hide();

            // Notificación según estado inicial
            const fakeRow: SubRow = {
              sub_id: resp?.sub_id ?? 0,
              user_id: payload.user_id,
              username: this.usuarios[payload.user_id],
              email: this.usuariosEmail[payload.user_id],
              sub_status: payload.sub_status,
              sub_end_date: payload.sub_end_date,
              sub_type_id: payload.sub_type_id,
              sub_type: this.typeNameFromId(payload.sub_type_id),
              sub_price: this.typePriceFromId(payload.sub_type_id)
            };
            const notif = this.buildSubSolicitud(fakeRow);

            if (payload.sub_status === 1) {
              this.notification.notifyUserSubscription('SUB_ACEPTADA', notif).subscribe({
                next: () => console.log('Email SUB_ACEPTADA (creación admin) enviado'),
                error: e => console.error('Error email SUB_ACEPTADA', e)
              });
            } else {
              this.notification.notifyUserSubscription('SUB_SOLICITADA', notif).subscribe({
                next: () => console.log('Email SUB_SOLICITADA (creación admin) enviado'),
                error: e => console.error('Error email SUB_SOLICITADA', e)
              });
              this.notification.notifyAdminNuevaSubSolicitud(notif)?.subscribe({
                next: () => console.log('Aviso admin NUEVA SUB (creación admin) enviado'),
                error: e => console.error('Error aviso admin NUEVA SUB', e)
              });
            }

            // 🔄 recarga
            this.cargarDatos();
            this.reloadComponent();
          },
          error: (e) => console.error('Error creando suscripción (admin)', e)
        });

      return;
    }

    // ======= EDITAR EXISTENTE =======
    const payload: any = { sub_id: Number(this.subEditando.sub_id) };
    if (this.subEditando.sub_end_date) payload.sub_end_date = this.subEditando.sub_end_date;
    if (this.subEditando.sub_type_id !== undefined) payload.sub_type_id = this.subEditando.sub_type_id;
    if (this.subEditando.sub_status !== undefined) payload.sub_status = Number(this.subEditando.sub_status);

    // Para decidir notificación si se activa desde aquí
    const old = this.subs.find(s => s.sub_id === this.subEditando.sub_id);

    this.http.post<any>('https://miniadritonff.com/api/edit_subscription.php', payload, { headers })
      .subscribe({
        next: () => {
          modal.hide();

          // Si desde el editor hemos pasado a ACTIVA, avisamos
          if (old && payload.sub_status === 1 && old.sub_status !== 1) {
            const updated: SubRow = {
              ...old,
              sub_end_date: payload.sub_end_date ?? old.sub_end_date,
              sub_type_id: payload.sub_type_id ?? old.sub_type_id,
              sub_status: 1
            };
            const notif = this.buildSubSolicitud(updated);
            this.notification.notifyUserSubscription('SUB_ACEPTADA', notif).subscribe({
              next: () => console.log('Email SUB_ACEPTADA (desde editar) enviado'),
              error: e => console.error('Error email SUB_ACEPTADA (editar)', e)
            });
          }

          // 🔄 recarga
          this.cargarDatos();
          this.reloadComponent();
        },
        error: (e) => console.error('Error al editar suscripción', e)
      });
  }

  // ======= Utilidades / helpers =======
  nombreUsuario(uid: number) { return this.usuarios[uid] ?? `ID ${uid}`; }
  emailUsuario(uid: number) { return this.usuariosEmail[uid] ?? ''; }

  estadoBadge(status: number): { label: string; cls: string } {
    return status === 1
      ? { label: 'Activa', cls: 'estado estado--ok' }
      : { label: 'Pendiente', cls: 'estado estado--pend' };
  }

  private typeNameFromId(id: number | null): string {
    if (id == null) return 'Suscripción';
    const t = this.subTypes.find(x => x.id === id);
    return t?.label ?? `Tipo #${id}`;
  }

  private typePriceFromId(id: number | null): number {
    if (id == null) return 0;
    const t = this.subTypes.find(x => x.id === id);
    return t?.price ?? 0;
  }

  private buildConcepto(sub: SubRow): string {
    const user = this.nombreUsuario(sub.user_id).replace(/\s+/g, '');
    const tipo = (sub.sub_type ?? `Tipo${sub.sub_type_id ?? ''}`).replace(/\s+/g, '');
    const y = sub.sub_end_date?.slice(0, 4) ?? '';
    const m = sub.sub_end_date?.slice(5, 7) ?? '';
    return `${user}-${tipo}-${y}${m}`;
  }

  private buildSubSolicitud(sub: SubRow): SubSolicitud {
    return {
      usuarioEmail: sub.email || this.emailUsuario(sub.user_id),
      usuarioNombre: sub.username || this.nombreUsuario(sub.user_id),
      administradorEmail: this.adminEmail,
      subTypeNombre: sub.sub_type ?? this.typeNameFromId(sub.sub_type_id),
      periodoLabel: 'Pago único',
      totalEuros: sub.sub_price ?? this.typePriceFromId(sub.sub_type_id),
      endDateISO: sub.sub_end_date,
      concepto: this.buildConcepto(sub)
    };
  }

  // ======= Helpers para la plantilla (evitar arrow functions/?? en HTML) =======
  getTypeById(id: number | null | undefined): SubTypeOpt | undefined {
    if (id == null) return undefined;
    return this.subTypes.find(t => t.id === Number(id));
  }

  getTypePrice(id: number | null | undefined): number {
    const t = this.getTypeById(id);
    return t && t.price != null ? Number(t.price) : 0;
  }

  getTypeLabel(id: number | null | undefined): string {
    if (id == null) return 'Suscripción';
    const t = this.getTypeById(id);
    return t?.label ?? `Tipo #${id}`;
  }

  /** Preview de concepto usando los valores del modal en edición/creación */
  previewConcept(): string {
    const uid = Number(this.subEditando?.user_id || 0);
    const user = (this.nombreUsuario(uid) || 'Usuario').replace(/\s+/g, '');
    const label = this.getTypeLabel(this.subEditando?.sub_type_id).replace(/\s+/g, '');
    const fecha = String(this.subEditando?.sub_end_date || '');
    const y = fecha.slice(0, 4);
    const m = fecha.slice(5, 7);
    return `${user}-${label}-${y}${m}`;
  }


  // ======= Recarga de página (gemelo a panel-consultas) =======
  reloadComponent(): void {
    const currentUrl = this.router.url;
    setTimeout(() => {
      this.router.navigateByUrl('/refresh', { skipLocationChange: true }).then(() => {
        this.router.navigate([currentUrl]);
      });
    }, 150);
  }
}
