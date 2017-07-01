import {Component, ViewEncapsulation, ContentChildren} from '@angular/core';
import template from './tabs.html!text';

// Musimy zaimportować komponent, bo wykorzystujemy go w adnotacji.
import {Tab} from './tab/tab';

@Component({
  selector: 'ngc-tabs',
  host: {
    class: 'tabs'
  },
  template,
  encapsulation: ViewEncapsulation.None
})
export class Tabs {
  // Odpytuje zawartość wewnątrz <ng-content> i przechowuje listę zapytania, która będzie się aktualizować po zmianie zawartości.
  @ContentChildren(Tab) tabs;

  // Metoda cyklu życia ngAfterContentInit zostanie wywołana, gdy treść wewnątrz <ng-content> będzie zainicjalizowana.
  ngAfterContentInit() {
    this.activateTab(this.tabs.first);
  }

  activateTab(tab) {
    // Aby uaktywnić zakładkę, konwertujemy aktualizowaną listę na tablicę i dezaktywujemy wszystkie zakładki przed ustawieniem nowej zakładki jako aktywnej.
    this.tabs.toArray().forEach((t) => t.active = false);
    tab.active = true;
  }
}
