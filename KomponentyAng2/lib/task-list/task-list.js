import { Component, ViewEncapsulation, Inject } from '@angular/core';
import template from './task-list.html !text';
import { TaskListService } from './task-list-service'

@Component({
  selector: 'ngc-task-list',
  host: {
    class: 'task-list'
  },
  template,
  encapsulation: ViewEncapsulation.None,
  providers: [TaskListService]
})

export class TaskList {
  constructor(@Inject(TaskListService)taskListService) {
    this.taskListService = taskListService;
    this.taskFilterList = ['wszystkie','otwarte','wykonane'];
    this.selectedTaskFilter = 'wszystkie'
  }
  getFilteredTasks() {
    return this.taskListService.tasks ? this.taskListService.tasks.filter((task) =>{
      if (this.selectedTaskFilter === 'wszystkie') {
        return true;
      } else if (this.selectedTaskFilter === 'otwarte') {
        return !task.done;
      } else {
        return task.done;
      }
    }) : [];
  }

  addTask(title) {
    this.taskListService.tasks.push({
      title, 
      done: false
    });
  }
}