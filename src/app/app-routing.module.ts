import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { LoginComponent } from './login/login.component';
import { PerfilComponent } from './perfil/perfil.component';
import { AuthGuard } from './guards/auth.guard';
import { ActualizarPerfilComponent } from './actualizar-perfil/actualizar-perfil.component';

const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'login', component: LoginComponent },
  { path: 'perfil', component: PerfilComponent, canActivate: [AuthGuard]  },
  { path: 'actualizar-perfil', component: ActualizarPerfilComponent, canActivate: [AuthGuard] },
  { path: '**', redirectTo: '' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
