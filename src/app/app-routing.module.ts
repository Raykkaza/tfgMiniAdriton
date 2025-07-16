import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { LoginComponent } from './login/login.component';
import { PerfilComponent } from './perfil/perfil.component';
import { AuthGuard } from './guards/auth.guard';
import { ActualizarPerfilComponent } from './actualizar-perfil/actualizar-perfil.component';
import { SesionCaducadaComponent } from './sesion-caducada/sesion-caducada.component';
import { ConsultasComponent } from './consultas/consultas.component';
import { Subscription } from 'rxjs';
import { SubscriptionGuard } from './guards/subscription.guard';
import { RegistroComponent } from './registro/registro.component';
import { PanelConsultasComponent } from './admin/panel-consultas/panel-consultas.component';
import { AdminGuard } from './guards/admin.guard';
import { RefreshComponent } from './refresh/refresh.component';

const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'login', component: LoginComponent },
  { path: 'refresh', component: RefreshComponent, canActivate: [AdminGuard] },
  { path: 'registro', component: RegistroComponent },
  { path: 'perfil', component: PerfilComponent, canActivate: [AuthGuard]  },
  { path: 'actualizar-perfil', component: ActualizarPerfilComponent, canActivate: [AuthGuard] },
  { path: 'sesion-caducada', component: SesionCaducadaComponent  },
  { path: 'consultas', component: ConsultasComponent, canActivate: [SubscriptionGuard] },
  { path: 'panelconsultas', component: PanelConsultasComponent, canActivate: [AdminGuard] },
  { path: '**', redirectTo: '' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { onSameUrlNavigation: 'reload' })],
  exports: [RouterModule]
})
export class AppRoutingModule { }
