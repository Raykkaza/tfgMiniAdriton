import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { LoginComponent } from './login/login.component';
import { PerfilComponent } from './perfil/perfil.component';
import { AuthGuard } from './guards/auth.guard';
import { ActualizarPerfilComponent } from './actualizar-perfil/actualizar-perfil.component';
import { SesionCaducadaComponent } from './sesion-caducada/sesion-caducada.component';
import { ConsultasComponent } from './consultas/consultas.component';
import { SubscriptionGuard } from './guards/subscription.guard';
import { RegistroComponent } from './registro/registro.component';
import { PanelConsultasComponent } from './admin/panel-consultas/panel-consultas.component';
import { AdminGuard } from './guards/admin.guard';
import { RefreshComponent } from './refresh/refresh.component';
import { SubsComponent } from './subs/subs.component';
import { PanelUsuariosComponent } from './admin/panel-usuarios/panel-usuarios.component';
import { PanelSubTypesComponent } from './admin/panel-sub-types/panel-sub-types.component';
import { PanelPagosComponent } from './admin/panel-pagos/panel-pagos.component';
import { PanelSubsComponent } from './admin/panel-subs/panel-subs.component';


const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'login', component: LoginComponent },
  { path: 'refresh', component: RefreshComponent, canActivate: [AdminGuard] },
  { path: 'registro', component: RegistroComponent },
  { path: 'suscripcion', component: SubsComponent },
  { path: 'perfil', component: PerfilComponent, canActivate: [AuthGuard]  },
  { path: 'actualizar-perfil', component: ActualizarPerfilComponent, canActivate: [AuthGuard] },
  { path: 'sesion-caducada', component: SesionCaducadaComponent  },
  { path: 'subs', component: SubsComponent, canActivate: [AuthGuard] },
  { path: 'consultas', component: ConsultasComponent, canActivate: [SubscriptionGuard] },
  { path: 'panelconsultas', component: PanelConsultasComponent, canActivate: [AdminGuard] },
  { path: 'panelusuarios', component: PanelUsuariosComponent, canActivate: [AdminGuard] },
  { path: 'panelsubs', component: PanelSubsComponent, canActivate: [AdminGuard] },
  { path: 'panelsubtipos', component: PanelSubTypesComponent, canActivate: [AdminGuard] },
  { path: 'panelpagos', component: PanelPagosComponent, canActivate: [AdminGuard] },
  { path: '**', redirectTo: '' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { onSameUrlNavigation: 'reload' })],
  exports: [RouterModule]
})
export class AppRoutingModule { }
