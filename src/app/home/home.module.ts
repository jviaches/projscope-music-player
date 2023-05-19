import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { HomeRoutingModule } from './home-routing.module';

import { HomeComponent } from './home.component';
import { SharedModule } from '../shared/shared.module';
import { ControlHowerColorirective } from '../core/directives/control-color.directive';

@NgModule({
  declarations: [HomeComponent, ControlHowerColorirective],
  imports: [CommonModule, SharedModule, HomeRoutingModule]
})
export class HomeModule {}
