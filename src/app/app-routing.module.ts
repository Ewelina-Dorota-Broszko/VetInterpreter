import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { FrontPageComponent } from './front-page/front-page.component';
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';
import { AboutComponent } from './about/about.component';
import { BlogComponent } from './blog/blog.component';
import { ContactComponent } from './contact/contact.component';
import { DashboardComponent } from './dashboard/dashboard.component';

import { AddDocumentComponent } from './add-document/add-document.component';
import { AnimalProfileComponent } from './animal-profile/animal-profile.component';

import { BloodFormComponent } from './blood-form/blood-form.component';
import { UrineFormComponent } from './urine-form/urine-form.component';
import { StoolFormComponent } from './stool-form/stool-form.component';
import { TemperatureFormComponent } from './temperature-form/temperature-form.component';
import { WeightFormComponent } from './weight-form/weight-form.component';
import { MedsFormComponent } from './meds-form/meds-form.component';
import { VaccinationFormComponent } from './vaccination-form/vaccination-form.component';
import { DiabetesFormComponent } from './diabetes-form/diabetes-form.component';
import { VisitNotesComponent } from './visit-notes/visit-notes.component';

import { DietComponent } from './diet/diet.component';
import { UserProfileComponent } from './user-profile/user-profile.component';
import { AnimalsAddFormComponent } from './animals-add-form/animals-add-form.component';
import { CalendarComponent } from './calendar/calendar.component';

import { FindVetComponent } from './find-vet/find-vet.component';
import { MyVetComponent } from './my-vet/my-vet.component';

import { VetPatientsComponent } from './vet-patients/vet-patients.component';
import { VetPatientProfileComponent } from './vet-patient-profile/vet-patient-profile.component';
import { VetAnimalProfileComponent } from './vet-animal-profile/vet-animal-profile.component';
import { VetProfileComponent } from './vet-profile/vet-profile.component';

import { AuthGuard } from './auth/auth.guard';
import { VetProfileCompleteGuard } from './auth/vet-profile-complete.guard';
import { VetAddDocumentComponent } from './vet-add-document/vet-add-document.component';
import { ClinicalNotesComponent } from './clinical-notes/clinical-notes.component';
import { AdminLayoutComponent } from './admin-layout/admin-layout.component';
import { AdminOwnersListComponent } from './admin-owners-list/admin-owners-list.component';
import { AdminVetsListComponent } from './admin-vets-list/admin-vets-list.component';
import { ChatRoomComponent } from './chat-room/chat-room.component';
import { ClientMessagesPanelComponent } from './client-messages-panel/client-messages-panel.component';
import { VetMessagesPanelComponent } from './vet-messages-panel/vet-messages-panel.component';

const routes: Routes = [
  { path: '', component: FrontPageComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'about', component: AboutComponent },
  { path: 'blog', component: BlogComponent },
  { path: 'contact', component: ContactComponent },

  // Strefa użytkownika
  { path: 'dashboard', component: DashboardComponent, canActivate: [AuthGuard] },
  { path: 'profile', component: UserProfileComponent, canActivate: [AuthGuard] },
  { path: 'animals/new', component: AnimalsAddFormComponent, canActivate: [AuthGuard] },
  { path: 'animal/:id', component: AnimalProfileComponent, canActivate: [AuthGuard] },
  { path: 'animal/:id/diet', component: DietComponent, canActivate: [AuthGuard] },
  { path: 'diet', component: DietComponent, canActivate: [AuthGuard] },
  { path: 'add-document', component: AddDocumentComponent, canActivate: [AuthGuard] },
  { path: 'calendar', component: CalendarComponent, canActivate: [AuthGuard] },

  // Formularze
  { path: 'form/blood', component: BloodFormComponent, canActivate: [AuthGuard] },
  { path: 'form/urine', component: UrineFormComponent, canActivate: [AuthGuard] },
  { path: 'form/stool', component: StoolFormComponent, canActivate: [AuthGuard] },
  { path: 'form/temperature', component: TemperatureFormComponent, canActivate: [AuthGuard] },
  { path: 'form/weight', component: WeightFormComponent, canActivate: [AuthGuard] },
  { path: 'form/meds', component: MedsFormComponent, canActivate: [AuthGuard] },
  { path: 'form/vaccination', component: VaccinationFormComponent, canActivate: [AuthGuard] },
  { path: 'form/diabetes', component: DiabetesFormComponent, canActivate: [AuthGuard] },
  { path: 'form/visit-notes', component: VisitNotesComponent, canActivate: [AuthGuard] },

  // Właściciel – weterynarze
  { path: 'find-vet', component: FindVetComponent, canActivate: [AuthGuard] },
  { path: 'my-vet', component: MyVetComponent, canActivate: [AuthGuard] },

  // Panel veta (zagnieżdżony) – wymagany login + rola veta; dzieci pilnowane przez VetProfileCompleteGuard
  {
    path: 'vet',
    canActivate: [AuthGuard],
    data: { requireVet: true },
    canActivateChild: [VetProfileCompleteGuard],
    children: [
      { path: 'profile', component: VetProfileComponent },                  // dostępny zawsze (guard powinien przepuszczać profile)
      { path: 'patients', component: VetPatientsComponent },                // blokowane, gdy profil niekompletny
      { path: 'patients/:ownerId', component: VetPatientProfileComponent }, // jw.
      { path: 'animal/:id', component: VetAnimalProfileComponent },         // jw.
      { path: '', redirectTo: 'profile', pathMatch: 'full' },
      { path: 'add-document', component: VetAddDocumentComponent },
      { path: 'notes', component: ClinicalNotesComponent }
    ]
  },
  {
    path: 'admin',
    component: AdminLayoutComponent,
    canActivate: [AuthGuard],
    data: { requireAdmin: true },
    children: [
      { path: 'vets', component: AdminVetsListComponent },
      { path: 'owners', component: AdminOwnersListComponent },
      { path: '', pathMatch: 'full', redirectTo: 'vets' },
      { path: 'panel', component: AdminLayoutComponent }
    ]
  },
  { path: 'messages', component: ClientMessagesPanelComponent },
  { path: 'vet/messages', component: VetMessagesPanelComponent },
 { path: 'chat/:id', component: ChatRoomComponent },

  // **ALIAS** dla starych linków /vet/patient/:ownerId  -> przekierowanie na /vet/patients/:ownerId
  { path: 'vet/patient/:ownerId', redirectTo: 'vet/patients/:ownerId', pathMatch: 'full' },

  // Fallback
  { path: '**', redirectTo: 'dashboard' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
