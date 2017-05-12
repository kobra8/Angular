import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UIModule } from '../ui/ui.module';
 
import { TaskList } from './task-list';
import { Task } from './task/task';
import { EnterTask } from './enter-task/enter-task'; 

@NgModule({
  declarations:[TaskList, Task, EnterTask],
  imports: [CommonModule, UIModule],
  exports: [TaskList]
})

export class TaskListModule {}