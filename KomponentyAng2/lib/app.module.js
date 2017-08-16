// Zaimportuj dekorator modułu i pozostałe zależności.
import { NgModule }       from '@angular/core';
import { BrowserModule  } from '@angular/platform-browser';
import { DataProvider } from '../data-access/data-provider'
import { App }   from './app';
import { NavigationModule } from './navigation/navigation.module';
import { ProjectModule } from './project/project.module';
import { DataProvider } from '../data-access/data-provider';

// Aplikacja wykorzystuje dyrektywę TaskList jako część modułu.
import {TaskListModule} from './task-list/task-list.module';

// Utwórz moduł główny wykorzystujący komponent główny aplikacji i moduł przeglądarki
// Następnie zaimportuj inne moduły aplikacji.
@NgModule({
  declarations: [App],
  imports:      [BrowserModule, NavigationModule, ProjectModule],
  bootstrap:    [App],
  providers: [DataProvider]
})
export class AppModule {}
