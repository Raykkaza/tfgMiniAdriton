import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';

declare var $: any;

type SubType = {
  sub_type_id: number;
  sub_type: string;
  sub_price: number;
};

@Component({
  selector: 'app-panel-sub-types',
  templateUrl: './panel-sub-types.component.html',
  styleUrls: ['./panel-sub-types.component.css']
})
export class PanelSubTypesComponent implements OnInit {
  tipos: SubType[] = [];

  // Edición
  editModel: Partial<SubType> = {};
  // Creación
  createModel: Partial<SubType> = {};

  // Mensajes
  msg = '';
  err = '';

  constructor(
    private http: HttpClient,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.cargarTipos();
  }

  private authHeaders(): HttpHeaders {
    const token = localStorage.getItem('token') || '';
    return new HttpHeaders({ 'Authorization': `Bearer ${token}` });
  }

  cargarTipos(): void {
    this.msg = '';
    this.err = '';

    const headers = this.authHeaders();
    this.http.get<SubType[]>('https://miniadritonff.com/api/get_sub_types.php', { headers })
      .subscribe({
        next: (res) => {
          this.tipos = res;

          // destruir si ya existe
          if ($.fn.DataTable.isDataTable('#subTypesTable')) {
            $('#subTypesTable').DataTable().destroy();
          }
          // reinit
          setTimeout(() => {
            $('#subTypesTable').DataTable({
              language: { url: 'https://cdn.datatables.net/plug-ins/1.10.24/i18n/Spanish.json' },
              pageLength: 10,
              lengthChange: true,
              ordering: true,
              searching: true,
              info: true
            });
          }, 50);
        },
        error: (e) => {
          console.error(e);
          this.err = e?.error?.error || 'No se pudieron cargar los tipos de suscripción.';
        }
      });
  }

  // ---------- Crear ----------
  abrirCrear(): void {
    this.createModel = { sub_type: '', sub_price: 0 };
    const modal = new (window as any).bootstrap.Modal(document.getElementById('crearTipoModal'));
    modal.show();
  }

  crear(): void {
    this.msg = '';
    this.err = '';

    const headers = this.authHeaders();
    const payload = {
      sub_type: (this.createModel.sub_type || '').trim(),
      sub_price: Number(this.createModel.sub_price ?? 0)
    };

    this.http.post<any>('https://miniadritonff.com/api/create_sub_type.php', payload, { headers })
      .subscribe({
        next: (res) => {
          const modal = (window as any).bootstrap.Modal.getInstance(document.getElementById('crearTipoModal'));
          modal.hide();
          this.msg = 'Tipo creado correctamente.';
          this.cargarTipos();
          this.reloadComponent();
        },
        error: (err) => {
          if (err.status === 409 && err.error?.code === 'TYPE_TAKEN') {
            this.err = 'Ya existe un tipo con ese nombre.';
          } else if (err.status === 400) {
            this.err = err.error?.error || 'Datos inválidos.';
          } else {
            this.err = err.error?.error || 'No se pudo crear el tipo.';
          }
        }
      });
  }

  // ---------- Editar ----------
  abrirEditar(t: SubType): void {
    this.editModel = { ...t };
    const modal = new (window as any).bootstrap.Modal(document.getElementById('editarTipoModal'));
    modal.show();
  }

  guardarEdicion(): void {
    this.msg = '';
    this.err = '';

    const headers = this.authHeaders();
    const payload: any = {
      sub_type_id: this.editModel.sub_type_id
    };
    if (this.editModel.sub_type !== undefined) payload.sub_type = (this.editModel.sub_type || '').trim();
    if (this.editModel.sub_price !== undefined) payload.sub_price = Number(this.editModel.sub_price);

    this.http.post<any>('https://miniadritonff.com/api/edit_sub_type.php', payload, { headers })
      .subscribe({
        next: () => {
          const modal = (window as any).bootstrap.Modal.getInstance(document.getElementById('editarTipoModal'));
          modal.hide();
          this.msg = 'Tipo actualizado.';
          this.cargarTipos();
          this.reloadComponent();
        },
        error: (err) => {
          if (err.status === 409 && err.error?.code === 'TYPE_TAKEN') {
            this.err = 'Ya existe un tipo con ese nombre.';
          } else if (err.status === 404) {
            this.err = 'Tipo no encontrado.';
          } else if (err.status === 400) {
            this.err = err.error?.error || 'Datos inválidos.';
          } else {
            this.err = err.error?.error || 'No se pudo actualizar el tipo.';
          }
        }
      });
  }

  // ---------- Eliminar ----------
  eliminar(sub_type_id: number): void {
    if (!confirm('¿Eliminar este tipo de suscripción?')) return;

    this.msg = '';
    this.err = '';

    const headers = this.authHeaders();
    this.http.post<any>('https://miniadritonff.com/api/delete_sub_type.php', { sub_type_id }, { headers })
      .subscribe({
        next: () => {
          this.msg = 'Tipo eliminado.';
          this.tipos = this.tipos.filter(t => t.sub_type_id !== sub_type_id);
          this.reloadComponent();
        },
        error: (err) => {
          if (err.status === 409 && err.error?.code === 'TYPE_IN_USE') {
            this.err = 'No se puede borrar: hay suscripciones que usan este tipo.';
          } else if (err.status === 404) {
            this.err = 'Tipo no encontrado.';
          } else {
            this.err = err.error?.error || 'No se pudo borrar el tipo.';
          }
        }
      });
  }

  // Recarga el componente actual
  reloadComponent(): void {
    const currentUrl = this.router.url;
    setTimeout(() => {
      this.router.navigateByUrl('/refresh', { skipLocationChange: true }).then(() => {
        this.router.navigate([currentUrl]);
      });
    }, 150);
  }
}
