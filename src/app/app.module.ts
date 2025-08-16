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
import { FullCalendarModule } from '@fullcalendar/angular';
import dayGridPlugin from '@fullcalendar/daygrid';
import { Calendar } from '@fullcalendar/core';
import { CalendarComponent } from './calendar/calendar.component';
import { DietComponent } from './diet/diet.component';
import { BloodTabComponent } from './blood-tab/blood-tab.component';
import { TemperatureTabComponent } from './temperature-tab/temperature-tab.component';
import { UrineTabComponent } from './urine-tab/urine-tab.component';
import { StoolTabComponent } from './stool-tab/stool-tab.component';
import { DiabetesTabComponent } from './diabetes-tab/diabetes-tab.component';
import { WeightTabComponent } from './weight-tab/weight-tab.component';
import { VaccinationsTabComponent } from './vaccinations-tab/vaccinations-tab.component';
import { MedsTabComponent } from './meds-tab/meds-tab.component';
import { SymptomsTabComponent } from './symptoms-tab/symptoms-tab.component';


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
    VisitNotesComponent,
    CalendarComponent,
    DietComponent,
    BloodTabComponent,
    TemperatureTabComponent,
    UrineTabComponent,
    StoolTabComponent,
    DiabetesTabComponent,
    WeightTabComponent,
    VaccinationsTabComponent,
    MedsTabComponent,
    SymptomsTabComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    FullCalendarModule,
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
