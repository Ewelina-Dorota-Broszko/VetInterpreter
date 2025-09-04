import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';
import { AboutComponent } from './about/about.component';
import { FrontPageComponent } from './front-page/front-page.component'
import { BlogComponent } from './blog/blog.component';
import { ContactComponent } from './contact/contact.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { DiabetesFormComponent } from './diabetes-form/diabetes-form.component';
import { TemperatureFormComponent } from './temperature-form/temperature-form.component';
import { StoolFormComponent } from './stool-form/stool-form.component';
import { AddDocumentComponent } from './add-document/add-document.component';
import { AnimalProfileComponent } from './animal-profile/animal-profile.component';
import { BloodFormComponent } from './blood-form/blood-form.component';
import { UrineFormComponent } from './urine-form/urine-form.component';
import { VisitNotesComponent } from './visit-notes/visit-notes.component';
import { DietComponent } from './diet/diet.component';
import { AuthGuard } from './auth/auth.guard';
import { UserProfileComponent } from './user-profile/user-profile.component';
import { WeightFormComponent } from './weight-form/weight-form.component';
import { MedsFormComponent } from './meds-form/meds-form.component';
import { VaccinationFormComponent } from './vaccination-form/vaccination-form.component';
import { SymptomsFormComponent } from './symptoms-form/symptoms-form.component';
import { VetProfileComponent } from './vet-profile/vet-profile.component';
import { AnimalsAddFormComponent } from './animals-add-form/animals-add-form.component';
import { CalendarComponent } from './calendar/calendar.component';
import { FindVetComponent } from './find-vet/find-vet.component';
import { VetPatientsComponent } from './vet-patients/vet-patients.component';
import { MyVetComponent } from './my-vet/my-vet.component';
import { VetPatientProfileComponent } from './vet-patient-profile/vet-patient-profile.component';
import { VetAnimalProfileComponent } from './vet-animal-profile/vet-animal-profile.component';

const routes: Routes = [
  { path: '', component: FrontPageComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'about', component: AboutComponent },
  { path: 'blog', component: BlogComponent },
  { path: 'contact', component: ContactComponent },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'add-document', component: AddDocumentComponent },
  { path: 'animal/:id', component: AnimalProfileComponent },
  { path: 'form/blood', component: BloodFormComponent },
  { path: 'form/stool', component: StoolFormComponent },
   { path: 'form/symptoms', component: SymptomsFormComponent },
  { path: 'form/weight', component: WeightFormComponent },
  { path: 'form/urine', component: UrineFormComponent },
  { path: 'form/meds', component: MedsFormComponent },
  { path: 'form/temperature', component: TemperatureFormComponent },
  { path: 'form/vaccination', component: VaccinationFormComponent },
  { path: 'form/diabetes', component: DiabetesFormComponent },
  { path: 'form/visit-notes', component: VisitNotesComponent },
  { path: 'animal/:id/diet', component: DietComponent },
  { path: 'diet', component: DietComponent },
  { path: 'dashboard', canActivate: [AuthGuard], component: DashboardComponent },
  { path: 'profile', component: UserProfileComponent },
  { path: 'animals/new', component: AnimalsAddFormComponent },
  { path: 'calendar', component: CalendarComponent },
  { path: 'find-vet', component: FindVetComponent },
  { path: 'my-vet', component: MyVetComponent, canActivate: [AuthGuard] },
    // dostępne tylko dla weterynarzy (bo requireVet = true)
  { path: 'vet/patients', component: VetPatientsComponent, canActivate: [AuthGuard], data: { requireVet: true } },
  { path: 'vet/patient/:ownerId', component: VetPatientProfileComponent, canActivate: [AuthGuard], data: { requireVet: true } },
  { path: 'vet/animal/:id', component: VetAnimalProfileComponent, canActivate: [AuthGuard], data: { requireVet: true } },
  { path: 'vet/patients', component: VetPatientsComponent, canActivate: [AuthGuard], data: { requireVet: true } },
  { path: 'vet/:id', component: MyVetComponent, canActivate: [AuthGuard] },
  { path: 'vet-profile', component: VetProfileComponent },

]

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
