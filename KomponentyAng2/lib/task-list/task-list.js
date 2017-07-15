import {Component, ViewEncapsulation, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import template from './task-list.html!text';


@Component({
  selector: 'ngc-task-list',
  // Właściwość host umożliwia ustawienie niektórych właściwości
  // na elemencie HTML, który powoduje użycie komponentu.
  host: {
    class: 'task-list'
  },
  template,
  // Ustaw TaskListService jako dostawcę.
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TaskList {
  @Input() tasks
  //Emitter zdarzeń wykonujący zgłoszenie zdarzenia, gdy została zmieniona lista zadań
  @Output() taskUpdated = new EventEmitter();
  // Określ dane do filtracji
  constructor(){
    this.taskFilterList = ['wszystkie', 'otwarte', 'wykonane'];
    this.selectedTaskFilter = 'wszystkie';
  }

  ngOnChanges(changes) {
    if(changes.tasks) {
      this.taskFilterChange(this.selectedTaskFilter);
    }
  }

  // Metoda zwraca przefiltrowaną listę zadań na podstawie wybranego rodzaju filtracji.
  taskFilterChange(filter) {
    this.selectedTaskFilter = filter;
    this.filteredTasks = this.tasks ? this.tasks.filter((task) => {
      if (filter === 'wszystkie') {
        return true;
      } else if (filter === 'otwarte') {
        return !task.done;
      } else {
        return task.done;
      }
    }) : [];
  }
  //Odniesienie do starego zadania aby uaktualnić jeden konkretny element na liście zadań
  onTaskUpdated(task, updatedData) {
    const tasks = this.tasks.slice();
    tasks.splice(tasks.indexOf(task), 1, Object.assign({}, task, updatedData));
    this.taskUpdated.next(tasks);
  }
  //Odniesienie do zadania, funkcja usunie je z listy oi wyśle uaktualnienie
  onTaskDeleted(task) {
  const tasks = this.tasks.slice();
  tasks.splice(tasks.indexOf(tasks),1);
  this.taskUpdated.next(tasks);
  }

  // Funkcja dodająca zadanie z widoku.
  addTask(title) {
    const tasks = this.tasks.slice();
    tasks.push({
      created: + new Date(),
      title,
      done: null
    })
    this.taskUpdated.next(tasks);
  }
}
