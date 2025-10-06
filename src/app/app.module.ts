import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
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
import { AuthInterceptor } from './auth/auth.interceptor';
import { AuthGuard } from './auth/auth.guard';
import { UserProfileComponent } from './user-profile/user-profile.component';
import { WeightFormComponent } from './weight-form/weight-form.component';
import { MedsFormComponent } from './meds-form/meds-form.component';
import { VaccinationFormComponent } from './vaccination-form/vaccination-form.component';
import { SymptomsFormComponent } from './symptoms-form/symptoms-form.component';
import { VetProfileComponent } from './vet-profile/vet-profile.component';
import { AnimalsAddFormComponent } from './animals-add-form/animals-add-form.component';
import { FindVetComponent } from './find-vet/find-vet.component';
import { VetPatientsComponent } from './vet-patients/vet-patients.component';
import { MyVetComponent } from './my-vet/my-vet.component';
import { VetPatientProfileComponent } from './vet-patient-profile/vet-patient-profile.component';
import { VetAnimalProfileComponent } from './vet-animal-profile/vet-animal-profile.component';
import { VetAddDocumentComponent } from './vet-add-document/vet-add-document.component';
import { VetProfileModalComponent } from './vet-profile-modal/vet-profile-modal.component';
import { ClinicalNotesComponent } from './clinical-notes/clinical-notes.component';
import { AdminLayoutComponent } from './admin-layout/admin-layout.component';
import { AdminOwnersListComponent } from './admin-owners-list/admin-owners-list.component';
import { AdminVetsListComponent } from './admin-vets-list/admin-vets-list.component';


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
    SymptomsTabComponent,
    UserProfileComponent,
    WeightFormComponent,
    MedsFormComponent,
    VaccinationFormComponent,
    SymptomsFormComponent,
    VetProfileComponent,
    AnimalsAddFormComponent,
    FindVetComponent,
    VetPatientsComponent,
    MyVetComponent,
    VetPatientProfileComponent,
    VetAnimalProfileComponent,
    VetAddDocumentComponent,
    VetProfileModalComponent,
    ClinicalNotesComponent,
    AdminLayoutComponent,
    AdminOwnersListComponent,
    AdminVetsListComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    FullCalendarModule,
    HttpClientModule,
    ReactiveFormsModule
  ],
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
