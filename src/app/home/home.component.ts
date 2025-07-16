import {  Component } from '@angular/core';
import { Observable } from 'rxjs';
import { BlogService, BlogPost } from '../services/blog.service';   


@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
})
export class HomeComponent {

  ngOnInit(): void {
    // Aquí puedes realizar cualquier inicialización necesaria
    // Por ejemplo, cargar datos o configurar el componente
  console.log('HomeComponent initialized');
  
  }
  /* -----------  Datos de la vista  ----------- */


  infografias = [
    'infografia1.jpg',
    'infografia2.jpg',
    'infografia3.jpg',
  ];

  

  testimonios = [
    {
      nombre: 'Laura G.',
      texto:
        'Gracias a MiniAdritonFF he aprendido a comer sin restricciones. ¡Increíble cambio!',
      img: 'https://randomuser.me/api/portraits/women/44.jpg',
    },
    {
      nombre: 'Carlos M.',
      texto: 'Nunca pensé que mejorar mi alimentación fuera tan fácil y efectivo.',
      img: 'https://randomuser.me/api/portraits/men/33.jpg',
    },
    {
      nombre: 'Elena R.',
      texto: 'Un trato cercano y profesional. ¡Volvería sin duda!',
      img: 'https://randomuser.me/api/portraits/women/68.jpg',
    },
  ];
  /* ------------------------------------------- */

  posts$!: Observable<BlogPost[]>;  

  constructor(private blog: BlogService) {
    this.posts$ = this.blog.getLatest();  
  }




}
