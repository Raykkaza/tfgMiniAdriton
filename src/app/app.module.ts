import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms'; 
import { HttpClient, HttpClientModule } from '@angular/common/http'; 
import { CalendarModule, DateAdapter } from 'angular-calendar';
import { adapterFactory } from 'angular-calendar/date-adapters/date-fns';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HomeComponent } from './home/home.component';
import { LoginComponent } from './login/login.component';
import { PerfilComponent } from './perfil/perfil.component';
import { ActualizarPerfilComponent } from './actualizar-perfil/actualizar-perfil.component';
import { SesionCaducadaComponent } from './sesion-caducada/sesion-caducada.component';
import { HeaderComponent } from './shared/header/header.component';
import { FooterComponent } from './shared/footer/footer.component';
import { ConsultasComponent } from './consultas/consultas.component';
import { RegistroComponent } from './registro/registro.component';
import { PanelConsultasComponent } from './admin/panel-consultas/panel-consultas.component';
import { RefreshComponent } from './refresh/refresh.component';
import { SubsComponent } from './subs/subs.component';
import { PanelUsuariosComponent } from './admin/panel-usuarios/panel-usuarios.component';

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    LoginComponent,
    PerfilComponent,
    ActualizarPerfilComponent,
    SesionCaducadaComponent,
    HeaderComponent,
    FooterComponent,
    ConsultasComponent,
    RegistroComponent,
    PanelConsultasComponent,
    RefreshComponent,
    SubsComponent,
    PanelUsuariosComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    HttpClientModule, 
    CalendarModule.forRoot({
      provide: DateAdapter,
      useFactory: adapterFactory
    })
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
