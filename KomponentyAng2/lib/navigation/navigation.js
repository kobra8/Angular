import {Component, ViewEncapsulation, Input, Output, EventEmitter} from '@angular/core';
import template from './navigation.html!text';


@Component({
  selector: 'ngc-navigation',
  host: {
    class: 'navigation'
  },
  template,
  encapsulation: ViewEncapsulation.None
})
export class Navigation {
  @Input() activeLink;
  @Output() activeLinkChange = new EventEmitter();

  // Sprawdza, czy element nawigacyjny jest obecnie aktywny na podstwie właściwości link.
  // Funkcja zostanie wywołana przez jeden z subkomponentów - navigation-item.
  isItemActive(item) {
    return item.link === this.activeLink;
  }

  // Jeśli łącze chce być aktywowane w nawigacji, należy wywołać tę funkcję.
  // W ten sposób elementy podrzędne mogą same się aktywować.
  activateLink(link) {
    this.activeLink = link;
    this.activeLinkChange.next(this.activeLink);
  }
}
