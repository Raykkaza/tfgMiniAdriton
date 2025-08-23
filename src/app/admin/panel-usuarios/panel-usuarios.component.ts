import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router, ActivatedRoute } from '@angular/router';

declare var $: any;

type UsuarioFila = {
  user_id: number;
  username: string;
  email: string;
  rol: number;
  img_perfil: string | null;
  active_sub: number;             
  sub_expiration_date: string | null;
};

type UserExtra = {
  user_data: any | null;
  extra_comments: string;
};

type KeyValue = { label: string; value: string };


@Component({
  selector: 'app-panel-usuarios',
  templateUrl: './panel-usuarios.component.html',
  styleUrls: ['./panel-usuarios.component.css']
})
export class PanelUsuariosComponent implements OnInit {
  usuarios: UsuarioFila[] = [];
  usuarioEditando: any = {};
  usuarioExtra: UserExtra | null = null;

  // campos auxiliares para edición de suscripción
  editSubStatus: number = 0;            // 0/1
  editSubEndDate: string = '';          // 'YYYY-MM-DD'

  constructor(
    private http: HttpClient,
    private router: Router,
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {
    this.cargarUsuarios();
  }

  private prettyLabel(key: string): string {
    return key
      .replace(/\./g, ' · ')
      .replace(/_/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase());
  }

  private flatten(obj: any, prefix = ''): KeyValue[] {
    if (obj == null) return [];
    const out: KeyValue[] = [];

    if (Array.isArray(obj)) {
      obj.forEach((v, i) => {
        const p = prefix ? `${prefix}.${i}` : String(i);
        if (v && typeof v === 'object') {
          out.push(...this.flatten(v, p));
        } else {
          out.push({ label: this.prettyLabel(p), value: String(v) });
        }
      });
    } else if (typeof obj === 'object') {
      Object.keys(obj).forEach(k => {
        const p = prefix ? `${prefix}.${k}` : k;
        const v = obj[k];
        if (v && typeof v === 'object') {
          out.push(...this.flatten(v, p));
        } else {
          out.push({ label: this.prettyLabel(p), value: v === null ? '—' : String(v) });
        }
      });
    } else {
      out.push({ label: this.prettyLabel(prefix || 'Valor'), value: String(obj) });
    }

    return out;
  }




  

  private authHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({ 'Authorization': `Bearer ${token}` });
  }

  cargarUsuarios(): void {
    const headers = this.authHeaders();
    this.http.get<UsuarioFila[]>('https://miniadritonff.com/api/get_users.php', { headers }).subscribe({
      next: (res) => {
        this.usuarios = res;

        // ⚠️ destruir si ya existe
        if ($.fn.DataTable.isDataTable('#usuariosTable')) {
          $('#usuariosTable').DataTable().destroy();
        }

        setTimeout(() => {
          $('#usuariosTable').DataTable({
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
      error: (e) => console.error('Error cargando usuarios', e)
    });
  }

  extraEntries: KeyValue[] = [];

  // Ver datos adicionales (abre modal de solo lectura)
  verDatos(user_id: number): void {
    const headers = this.authHeaders();
    this.http.get<UserExtra>(`https://miniadritonff.com/api/get_user_data_admin.php?user_id=${user_id}`, { headers })
      .subscribe({
        next: (data) => {
          this.usuarioExtra = data;
          this.extraEntries = this.flatten(this.usuarioExtra.user_data); 

          const modal = new (window as any).bootstrap.Modal(document.getElementById('verDatosModal'));
          modal.show();
        },
        error: (e) => {
          console.error('Error cargando datos extra', e);
          this.usuarioExtra = { user_data: null, extra_comments: '' };
          this.extraEntries = [];
          const modal = new (window as any).bootstrap.Modal(document.getElementById('verDatosModal'));
          modal.show();
        }
      });
  }

  editarUsuario(u: UsuarioFila): void {
    // precarga en el modal de edición
    this.usuarioEditando = { ...u };
    this.editSubStatus = u.active_sub;
    this.editSubEndDate = u.sub_expiration_date || '';

    const modal = new (window as any).bootstrap.Modal(document.getElementById('editarUsuarioModal'));
    modal.show();
  }

  guardarCambios(): void {
    const headers = this.authHeaders();

    const payload = {
      user_id: this.usuarioEditando.user_id,
      username: this.usuarioEditando.username,
      email: this.usuarioEditando.email,
      rol: this.usuarioEditando.rol,
      img_perfil: this.usuarioEditando.img_perfil || null,
      // bloque suscripción
      sub_status: Number(this.editSubStatus),         // 0/1
      sub_end_date: this.editSubEndDate || null,      // YYYY-MM-DD o null
    };

    this.http.post<any>('https://miniadritonff.com/api/edit_user.php', payload, { headers })
      .subscribe({
        next: () => {
          const modal = (window as any).bootstrap.Modal.getInstance(document.getElementById('editarUsuarioModal'));
          modal.hide();
          this.cargarUsuarios();
          this.reloadComponent();
        },
        error: (e) => console.error('Error al editar usuario', e)
      });
  }

  eliminarUsuario(user_id: number): void {
    if (!confirm(`¿Eliminar usuario #${user_id}? Esta acción no se puede deshacer.`)) return;

    const headers = this.authHeaders();
    this.http.post<any>('https://miniadritonff.com/api/delete_user.php', { user_id }, { headers })
      .subscribe({
        next: () => {
          this.usuarios = this.usuarios.filter(u => u.user_id !== user_id);
          this.reloadComponent();
        },
        error: (e) => console.error('Error al eliminar usuario', e)
      });
  }

  // mismo patrón que consultas
  reloadComponent(): void {
    const currentUrl = this.router.url;
    setTimeout(() => {
      this.router.navigateByUrl('/refresh', { skipLocationChange: true }).then(() => {
        this.router.navigate([currentUrl]);
      });
    }, 150);
  }
}
