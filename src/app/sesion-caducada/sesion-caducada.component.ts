import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-sesion-caducada',
  templateUrl: './sesion-caducada.component.html',
  styleUrls: ['./sesion-caducada.component.css']
})
export class SesionCaducadaComponent {
  constructor(private router: Router, private auth: AuthService) { }

  volverInicio() {
    this.auth.logout(); 
    this.router.navigate(['/']);
  }
}
