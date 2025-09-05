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

  console.log('HomeComponent initialized');
  
  }
  /* -----------  Datos de la vista  ----------- */


  infografias = [
    'infografia1.jpg',
    'infografia2.jpg',
    'infografia3.jpg',
  ];

  

  /* ------------------------------------------- */

  posts$!: Observable<BlogPost[]>;  

  constructor(private blog: BlogService) {
    this.posts$ = this.blog.getLatest();  
  }




}
