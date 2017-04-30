import { Observable, Subject } from 'rxjs';
import { WatchNotification } from "./messages";

export class WatchableObservable<T> extends Observable<T> {
    subscriptions: Observable<Observable<WatchNotification<T>>> = new Subject<Observable<WatchNotification<T>>>();


}
