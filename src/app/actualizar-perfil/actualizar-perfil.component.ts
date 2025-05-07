import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Component({
  selector: 'app-actualizar-perfil',
  templateUrl: './actualizar-perfil.component.html',
  styleUrls: ['./actualizar-perfil.component.css']
})
export class ActualizarPerfilComponent implements OnInit {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  username: string = '';
  email: string = '';
  previewUrl: string = '';
  selectedFile: File | null = null;

  form: any = {
    deporte_semanal: 0,
    intensidad_deporte: '',
    alergenos_intolerancias: '',
    peso_actual: null,
    altura: null,
    sexo_biologico: ''
  };

  extraComments: string = '';
  mostrarAdicional = false;

  constructor(private http: HttpClient, private router: Router) { }

  ngOnInit() {
    this.username = localStorage.getItem('username') || '';
    this.email = localStorage.getItem('email') || '';
    const img = localStorage.getItem('img_perfil');
    this.previewUrl = img ? `https://miniadritonff.com/api/${img}` : 'https://via.placeholder.com/150?text=Perfil';

    this.cargarDatosAdicionales();
  }

  cargarDatosAdicionales() {
    const token = localStorage.getItem('token') || '';
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });

    this.http.get<any>('https://miniadritonff.com/api/get_user_data.php', { headers }).subscribe({
      next: (res) => {
        if (res.user_data) this.form = res.user_data;
        this.extraComments = res.extra_comments;
      },
      error: (err) => {
        console.error('Error al cargar datos adicionales:', err);
      }
    });
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.selectedFile = input.files[0];

      const reader = new FileReader();
      reader.onload = () => {
        this.previewUrl = reader.result as string;
      };
      reader.readAsDataURL(this.selectedFile);
    }
  }

  guardar() {
    if (!this.email.includes('@')) {
      alert('El email no es válido');
      return;
    }

    const token = localStorage.getItem('token') || '';
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });

    // 1. Subir imagen si se ha seleccionado
    if (this.selectedFile) {
      const formData = new FormData();
      formData.append('imagen', this.selectedFile);

      this.http.post<any>('https://miniadritonff.com/api/upload_profile_image.php', formData, { headers }).subscribe({
        next: (res) => {
          localStorage.setItem('img_perfil', res.img_perfil);
        },
        error: (err) => {
          console.error('Error al subir imagen:', err);
        }
      });
    }

    // 2. Guardar user_data
    const payload = {
      user_data: this.form,
      extra_comments: this.extraComments
    };

    this.http.post<any>('https://miniadritonff.com/api/update_user_data.php', payload, { headers }).subscribe({
      next: () => {
        console.log('Datos actualizados');
      },
      error: (err) => {
        console.error('Error al actualizar datos:', err);
      }
    });

    // 3. Actualizar username y email
    const datos = { username: this.username, email: this.email };
    this.http.post<any>('https://miniadritonff.com/api/update_basic_info.php', datos, { headers }).subscribe({
      next: () => {
        localStorage.setItem('username', this.username);
        localStorage.setItem('email', this.email);
        this.router.navigate(['/perfil']);
      },
      error: (err) => {
        console.error('Error al actualizar info básica:', err);
      }
    });
  }

  cancelar() {
    this.router.navigate(['/perfil']);
  }
}
