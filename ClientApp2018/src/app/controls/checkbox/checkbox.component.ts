import { Component, OnInit, Input, ViewEncapsulation, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-checkbox',
  templateUrl: './checkbox.component.html',
  host: { 'class': 'app-checkbox' },
  styleUrls: ['./checkbox.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class CheckboxComponent implements OnInit {

  @Input()
  required: boolean;

  @Input()
  checked: boolean;

  @Input()
  name: string;

  @Output()
  changeValue: EventEmitter<any>;

  constructor() {
    this.changeValue = new EventEmitter<any>();
  }

  ngOnInit() {
  }

  changeMiddleware() {
    //there is bug in chrome: checkbox value is allways 'on'
    //don't use event target value
    this.checked = !this.checked;
    this.changeValue.emit(this.checked);
  }
}
