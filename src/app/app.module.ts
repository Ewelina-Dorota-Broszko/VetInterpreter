import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { FrontPageComponent } from './front-page/front-page.component';
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';
import { AboutComponent } from './about/about.component';
import { BlogComponent } from './blog/blog.component';
import { ContactComponent } from './contact/contact.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DashboardComponent } from './dashboard/dashboard.component';
import { NavbarComponent } from './navbar/navbar.component';
import { AddDocumentComponent } from './add-document/add-document.component';
import { AnimalProfileComponent } from './animal-profile/animal-profile.component';
import { BloodFormComponent } from './blood-form/blood-form.component';
import { StoolFormComponent } from './stool-form/stool-form.component';
import { UrineFormComponent } from './urine-form/urine-form.component';
import { DiabetesFormComponent } from './diabetes-form/diabetes-form.component';
import { TemperatureFormComponent } from './temperature-form/temperature-form.component';
import { VisitNotesComponent } from './visit-notes/visit-notes.component';

@NgModule({
  declarations: [
    AppComponent,
    FrontPageComponent,
    LoginComponent,
    RegisterComponent,
    AboutComponent,
    BlogComponent,
    ContactComponent,
    DashboardComponent,
    NavbarComponent,
    AddDocumentComponent,
    AnimalProfileComponent,
    BloodFormComponent,
    StoolFormComponent,
    UrineFormComponent,
    DiabetesFormComponent,
    TemperatureFormComponent,
    VisitNotesComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    ReactiveFormsModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
