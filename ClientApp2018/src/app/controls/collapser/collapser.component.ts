import { Component, OnInit, Input, Output, EventEmitter, HostBinding, ViewEncapsulation} from '@angular/core';

@Component({
  selector: 'app-collapser',
  templateUrl: './collapser.component.html',
  host: { 'class': 'app-collapser' },
  styleUrls: ['./collapser.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class CollapserComponent implements OnInit {

  @HostBinding('class.expanded') @Input()
  isOpen?: boolean;

  @Input()
  whenCollapsing?: boolean;

  @Output()
  close: EventEmitter<any>;

  @Output()
  open: EventEmitter<any>;

  @Output()
  firstOpen: EventEmitter<any>;

  wasOpened: boolean;

  constructor() {

    if (this.whenCollapsing === undefined) {
      this.whenCollapsing = true;
    }
   
    if (this.isOpen === undefined) {
        this.isOpen = false;
    }

    this.open = new EventEmitter<any>();
    this.close = new EventEmitter<any>();
    this.firstOpen = new EventEmitter<any>();
  }

  ngOnInit() {

    if (this.whenCollapsing === true && this.isOpen === true) {
        this.firstOpen.emit();
        this.wasOpened = true;           
    } else {
        this.wasOpened = false;
    }
  }

  changeDisplay() {

      this.isOpen = !this.isOpen;

      if (this.isOpen) {

        if (!this.wasOpened) {
          this.firstOpen.emit();
          this.wasOpened = true;
        }

        this.open.emit();


      } else {

        this.close.emit();

      }
  }
}
