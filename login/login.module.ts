import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FlexLayoutModule } from '@angular/flex-layout';

import { LoginRoutingModule } from './login-routing.module';
import { LoginComponent } from './login.component';
import { FormsModule } from '@angular/forms';
import { NgxSpinnerModule } from 'ngx-spinner';
import { MaterialModule } from '../shared/modules/material/material.module';

@NgModule({
  imports: [
    CommonModule,
    LoginRoutingModule,
    MaterialModule,
    FlexLayoutModule.withConfig({ addFlexToParent: false }),
    FormsModule,
    NgxSpinnerModule
  ],
  declarations: [LoginComponent]
})
export class LoginModule {}
