import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SsoComponent } from './sso/sso.component';

const routes: Routes = [
  { path: '', redirectTo: '/sso', pathMatch: 'full' },
  { path: 'sso', component: SsoComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
