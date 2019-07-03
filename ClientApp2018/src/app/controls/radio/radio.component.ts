import { Component, OnInit, Input, ViewEncapsulation, Output, EventEmitter } from '@angular/core';

@Component({
    selector: 'app-radio',
    templateUrl: './radio.component.html',
    host: { 'class': 'app-radio' },
    styleUrls: ['./radio.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class RadioComponent implements OnInit {
    

    @Input()
    required: boolean;

    @Input()
    name: string;

    @Input()
    value: any;

    @Output()
    changeValue: EventEmitter<any>;

    @Input()
    checked: boolean;

    constructor() {
        this.changeValue = new EventEmitter<any>();
    }

    ngOnInit() {


    }


    changeMiddleware(value) {

        this.changeValue.emit(this.value);
   
    }
}
