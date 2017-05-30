import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { App } from './app';
import { TaskListModule } from './task-list/task-list.module';
import { DataProvider } from '../data-access/data-provider';

@NgModule({
  declarations: [App],
  imports: [BrowserModule, TaskListModule],
  bootstrap: [App],
  providers: [DataProvider]
})
export class AppModule {}