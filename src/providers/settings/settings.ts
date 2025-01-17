import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs/Rx';

@Injectable()
export class SettingsProvider {

    private theme: BehaviorSubject<String>;

    constructor() {
        this.theme = new BehaviorSubject('user-theme');
    }

    setActiveTheme(val) {
        this.theme.next(val);
    }

    getActiveTheme() {
        return this.theme.asObservable();
    }
}
