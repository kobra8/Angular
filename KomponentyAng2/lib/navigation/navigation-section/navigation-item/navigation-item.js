import {Component, ViewEncapsulation, Input, Inject} from '@angular/core';
import template from './navigation-item.html!text';

// Polegamy na komponencie nawigacyjnym, aby stwierdzić własną aktywność.
import {Navigation} from '../../navigation';

@Component({
  selector: 'ngc-navigation-item',
  host: {
    class: 'navigation-item',
    // Ponieważ komponent będzie reprezentował element <li>, dodajmy odpowiednią rolę dla narzędzi dla niedowidzących.
    role: 'listitem'
  },
  template,
  encapsulation: ViewEncapsulation.None
})
export class NavigationItem {
  @Input() title;
  @Input() link;

  constructor(@Inject(Navigation) navigation) {
    this.navigation = navigation;
  }

  // Tutaj wykorzystujemy komponent nawigacji, aby sprawdzić, czy jesteśmy aktywni.
  isActive() {
    return this.navigation.isItemActive(this);
  }

  // Jeśli link zostanie uaktywniony, poinformuj komponent nawigacji.
  onActivate() {
    this.navigation.activateLink(this.link);
  }
}
