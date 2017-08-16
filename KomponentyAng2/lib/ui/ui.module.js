import { NgModule } from '@angular/core';

// Wczytaj moduł zawierający podstawowe dyrektywy.
import {CommonModule} from '@angular/common';

// Wczytaj komponenty.
import {Checkbox} from './checkbox/checkbox';
import {Toggle} from './toggle/toggle';
import {Tabs} from './tabs/tabs';
import {Tab} from './tabs/tab/tab';

// Utwórz moduł listy zadań.
@NgModule({
  declarations: [Checkbox, Toggle, Tab, Tabs],
  imports: [CommonModule],
  exports: [Checkbox, Toggle, Tab, Tabs]
})
export class UIModule {}
