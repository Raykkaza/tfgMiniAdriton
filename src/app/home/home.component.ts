import {  Component } from '@angular/core';



@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
})
export class HomeComponent {
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

 




}
