import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router, ActivatedRoute } from '@angular/router';

declare var $: any;

type Pago = {
  payment_id: number;
  user_id: number;
  payment_ammount: number;       
  payment_date: string;         
  payment_concept: string;
  username?: string;
  email?: string;
};

type UsersMap = Record<number, string>;
type EmailsMap = Record<number, string>;

@Component({
  selector: 'app-panel-pagos',
  templateUrl: './panel-pagos.component.html',
  styleUrls: ['./panel-pagos.component.css']
})
export class PanelPagosComponent implements OnInit {
  pagos: Pago[] = [];
  pagoEditando: any = {};
  usuarios: UsersMap = {};
  usuariosEmail: EmailsMap = {};
  modoCrear = false;

  constructor(
    private http: HttpClient,
    private router: Router,
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {
    this.cargarDatos();
  }

  private authHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({ 'Authorization': `Bearer ${token}` });
  }

  cargarDatos(): void {
    const headers = this.authHeaders();

    // 1) Usuarios → map id→nombre/email 
    this.http.get<any[]>('https://miniadritonff.com/api/get_users.php', { headers }).subscribe({
      next: (res) => {
        res.forEach(u => this.usuarios[u.user_id] = u.username);
        res.forEach(u => this.usuariosEmail[u.user_id] = u.email);

        // 2) Pagos
        this.http.get<{ payments: Pago[] }>('https://miniadritonff.com/api/get_payments.php', { headers })
          .subscribe({
            next: ({ payments }) => {
              // enriquece por si el endpoint no trae username/email
              this.pagos = payments.map(p => ({
                ...p,
                username: p.username ?? this.usuarios[p.user_id] ?? `ID ${p.user_id}`,
                email: p.email ?? this.usuariosEmail[p.user_id] ?? ''
              }));

              // Reinit DataTable
              if ($.fn.DataTable.isDataTable('#pagosTable')) {
                $('#pagosTable').DataTable().destroy();
              }
              setTimeout(() => {
                $('#pagosTable').DataTable({
                  language: {
                    url: 'https://cdn.datatables.net/plug-ins/1.10.24/i18n/Spanish.json'
                  },
                  pageLength: 10,
                  lengthChange: true,
                  ordering: true,
                  searching: true,
                  info: true
                });
              }, 50);
            },
            error: (e) => console.error('Error cargando pagos', e)
          });
      },
      error: (e) => console.error('Error cargando usuarios', e)
    });
  }

  // ---------- CRUD ----------
  nuevoPago(): void {
    this.modoCrear = true;
    this.pagoEditando = {
      payment_id: 0,
      user_id: null,
      payment_ammount: null,
      payment_date: new Date().toISOString().slice(0, 10), // hoy
      payment_concept: ''
    };

    const modal = new (window as any).bootstrap.Modal(document.getElementById('editarPagoModal'));
    modal.show();
  }

  editarPago(p: Pago): void {
    this.modoCrear = false;
    this.pagoEditando = {
      payment_id: p.payment_id,
      user_id: p.user_id,
      payment_ammount: Number(p.payment_ammount).toFixed(2),
      payment_date: p.payment_date,
      payment_concept: p.payment_concept
    };

    const modal = new (window as any).bootstrap.Modal(document.getElementById('editarPagoModal'));
    modal.show();
  }

  guardarCambios(): void {
    const headers = this.authHeaders();
    const modal = (window as any).bootstrap.Modal.getInstance(document.getElementById('editarPagoModal'));

    // normaliza amount a 2 decimales
    const raw = this.pagoEditando.payment_amount ?? this.pagoEditando.payment_ammount;
    const amount = raw !== null && raw !== undefined ? Number(parseFloat(String(raw)).toFixed(2)) : null;

    if (this.modoCrear) {
      const payload = {
        user_id: Number(this.pagoEditando.user_id),
        // El PHP acepta payment_amount o payment_ammount
        payment_ammount: amount,
        payment_concept: String(this.pagoEditando.payment_concept).trim(),
        payment_date: this.pagoEditando.payment_date // 'YYYY-MM-DD'
      };

      this.http.post<any>('https://miniadritonff.com/api/create_payment.php', payload, { headers })
        .subscribe({
          next: () => { modal.hide(); this.cargarDatos(); this.reloadComponent(); },
          error: (e) => console.error('Error creando pago', e)
        });
    } else {
      const payload = {
        payment_id: Number(this.pagoEditando.payment_id),
        user_id: Number(this.pagoEditando.user_id),
        payment_ammount: amount,
        payment_date: this.pagoEditando.payment_date,
        payment_concept: String(this.pagoEditando.payment_concept).trim()
      };

      this.http.post<any>('https://miniadritonff.com/api/edit_payment.php', payload, { headers })
        .subscribe({
          next: () => { modal.hide(); this.cargarDatos(); this.reloadComponent(); },
          error: (e) => console.error('Error editando pago', e)
        });
    }
  }

  eliminarPago(payment_id: number): void {
    if (!confirm(`¿Eliminar pago #${payment_id}? Esta acción no se puede deshacer.`)) return;

    const headers = this.authHeaders();
    this.http.post<any>('https://miniadritonff.com/api/delete_payment.php', { payment_id }, { headers })
      .subscribe({
        next: () => {
          this.pagos = this.pagos.filter(p => p.payment_id !== payment_id);
          // refresca DataTable
          if ($.fn.DataTable.isDataTable('#pagosTable')) {
            $('#pagosTable').DataTable().destroy();
          }
          setTimeout(() => {
            $('#pagosTable').DataTable({
              language: { url: 'https://cdn.datatables.net/plug-ins/1.10.24/i18n/Spanish.json' },
              pageLength: 10
            });
          }, 50);
        },
        error: (e) => console.error('Error eliminando pago', e)
      });
  }

  // ---------- Utilidades ----------
  nombreUsuario(uid: number) { return this.usuarios[uid] ?? `ID ${uid}`; }
  emailUsuario(uid: number) { return this.usuariosEmail[uid] ?? ''; }

  reloadComponent(): void {
    const currentUrl = this.router.url;
    setTimeout(() => {
      this.router.navigateByUrl('/refresh', { skipLocationChange: true }).then(() => {
        this.router.navigate([currentUrl]);
      });
    }, 150);
  }
}
