import { Component, ViewEncapsulation } from '@angular/core';
import {} from './project/project-service/project-service';
import template from './app.html !text';

@Component({
  selector: 'ngc-app',
  template,
  encapsulation: ViewEncapsulation.None
})

export class App {}