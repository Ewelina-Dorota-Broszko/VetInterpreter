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
  { path: 'form/urine', component: UrineFormComponent },
  { path: 'form/temperature', component: TemperatureFormComponent },
  { path: 'form/diabetes', component: DiabetesFormComponent },
  { path: 'form/visit-notes', component: VisitNotesComponent },
  { path: 'animal/:id/diet', component: DietComponent },
  { path: 'diet', component: DietComponent },
  { path: 'dashboard', canActivate: [AuthGuard], component: DashboardComponent },
  { path: 'profile', component: UserProfileComponent },

]

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
