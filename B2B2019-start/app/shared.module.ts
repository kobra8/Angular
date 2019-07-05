import { NgModule, CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormatPipe } from './helpers/pipes/format.pipe';
import { HighlightPipe } from './helpers/pipes/highlight.pipe';
import { IterableToArrayPipe } from './helpers/pipes/iterable-to-array.pipe';
import { PercentOrEmpty } from './helpers/pipes/percent-or-empty';
import { ToPricePipe } from './helpers/pipes/to-price.pipe';
import { ModalComponent } from './controls/modal/modal.component';
import { DropdownComponent } from './controls/dropdown/dropdown.component';
import { LoadingComponent } from './controls/loading/loading.component';
import { FloatingLabelInputComponent } from './controls/floating-label-input/floating-label-input.component';
import { PagerComponent } from './controls/pager/pager.component';
import { StepperComponent } from './controls/stepper/stepper.component';
import { CheckboxComponent } from './controls/checkbox/checkbox.component';
import { RadioComponent } from './controls/radio/radio.component';
import { CollapserComponent } from './controls/collapser/collapser.component';
import { SliderComponent } from './controls/slider/slider.component';
import { ProductsTableComponent } from './components/products-table/products-table.component';
import { LazyImageComponent } from './controls/lazy-image/lazy-image.component';
import { SelectComponent } from './controls/select/select/select.component';
import { OptionComponent } from './controls/select/option/option.component';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { ProfileMenuComponent } from './components/profile-menu/profile-menu.component';
import { LazySrcDirective } from './helpers/directives/lazy-src.directive';
import { MenuComponent } from './components/menu/menu.component';
import { GroupsComponent } from './components/groups/groups.component';
import { GlobalHttpInterceptor } from './model/global-http-interceptor';
import { AccountService } from './model/account.service';
import { ConfigService } from './model/config.service';
import { NavigableByKeyboardComponent } from './controls/navigable-by-keyboard/navigable-by-keyboard.component';
import { ImportCartResultsComponent } from './components/import-cart-results/import-cart-results.component';
import { ImportCartResultsViewComponent } from './components/import-cart-results-view/import-cart-results-view.component';

@NgModule({
    imports: [
        CommonModule,
        RouterModule,
        HttpClientModule,
        FormsModule
    ],
    declarations: [
        GroupsComponent,
        MenuComponent,
        FormatPipe,
        HighlightPipe,
        IterableToArrayPipe,
        PercentOrEmpty,
        ToPricePipe,
        ModalComponent,
        DropdownComponent,
        LoadingComponent,
        FloatingLabelInputComponent,
        PagerComponent,
        StepperComponent,
        CheckboxComponent,
        RadioComponent,
        CollapserComponent,
        SliderComponent,
        ProductsTableComponent,
        LazySrcDirective,
        LazyImageComponent,
        SelectComponent,
        OptionComponent,
        ProfileMenuComponent,
        NavigableByKeyboardComponent,
        ImportCartResultsComponent,
        ImportCartResultsViewComponent
    ],
    exports: [
        HttpClientModule,
        CommonModule,
        FormsModule,
        MenuComponent,
        GroupsComponent,
        FormatPipe,
        HighlightPipe,
        IterableToArrayPipe,
        PercentOrEmpty,
        ToPricePipe,
        ModalComponent,
        DropdownComponent,
        LoadingComponent,
        FloatingLabelInputComponent,
        PagerComponent,
        StepperComponent,
        CheckboxComponent,
        RadioComponent,
        CollapserComponent,
        SliderComponent,
        ProductsTableComponent,
        LazySrcDirective,
        LazyImageComponent,
        SelectComponent,
        OptionComponent,
        ProfileMenuComponent,
        NavigableByKeyboardComponent
    ],
    providers: [
        {
            provide: HTTP_INTERCEPTORS,
            useClass: GlobalHttpInterceptor,
            deps: [Router, AccountService, ConfigService],
            multi: true
        }
    ],
    schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA]
})
export class SharedModule {}
