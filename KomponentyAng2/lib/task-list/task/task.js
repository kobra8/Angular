import { Component, Input, ViewEncapsulation, EventEmitter, HostBinding, Output, ChangeDetectionStrategy } from '@angular/core';
import template from './task.html!text';

@Component({
  selector: 'ngc-task',
  host: {
    class: 'task'
  },
  template,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.onPush
})
export class Task {
  // Model task może zostać dołączony na elemencie nadrzędnym wewnątrz widoku.
  @Input() task;
  // Informujemy element nadrzędny o modyfikacji zadania
  @Output() taskUpdated = new EventEmitter();
  @Output() taskDeleted = new EventEmitter();
  @HostBinding('class.task--done')
  get done() {
    return this.task && this.task.done;
  }
  //Używamy tej funkcji do aktualizacji stanu zaznaczenia zadania
  markDone(checked) {
    this.taskUpdated.next({
      title: this.task.title,
      done: checked ? +new Date() : null
    });
  }
  //Aby usunąć zadanie emitujemy zdarzenie, a komponent nadrzędny zrobi resztę
  deleteTask(){
    this.taskDeleted.next();
  }
}
