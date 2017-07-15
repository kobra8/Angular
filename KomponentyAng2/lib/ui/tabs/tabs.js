import { Component, ViewEncapsulation, ContentChildren } from '@angular/core';
import template from './tabs.html!text';
import { Tab } from './tab/tab';

@Component({
  selector: 'ngc-tabs',
  host: {
    class: 'tabs'
  },
  template,
  encapsulation: ViewEncapsulation.None
})

export class Tabs {
  // Odpytuje zawartość wewnątrz <ng-content>  i przechowuje listę zapytania, która będzie się aktualizować
  @ContentChildren(Tab) tabs;
  //Metoda cyklu życia ngAfterContentInit zostanie wywołana gdy treść <ng-content> będzie zainicjalizowana
  ngAfterContentInit() {
    this.activateTab(this.tabs.first);
  }
  activateTab(tab) {
    //Aby uaktywnić zakładkę, konwertujemy aktualizowaną listę na tablicę i dezaktywujemy wszystkie zakładki 
    //przed ustawieniem nowej zakładki jako aktywnej
    
    console.log(this.tabs.toArray())
    this.tabs.toArray().forEach((t) => t.active = false);
    tab.active = true;
  }
}