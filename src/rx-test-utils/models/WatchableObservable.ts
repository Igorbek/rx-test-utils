import { Observable, Subject, Subscriber } from 'rxjs';
import { Subscribable } from 'rxjs/Observable';
import { Subscription, TeardownLogic } from 'rxjs/Subscription'
import { WatchNotification } from "./messages";

export class WatchableObservable<T> extends Observable<T> {
    readonly subscriptions: Observable<Observable<WatchNotification<T>>> = new Subject<Observable<WatchNotification<T>>>();
    private _source: Observable<T>;

    constructor(source: Observable<T>) {
        super();
        this._source = source;
    }

    protected _subscribe(subscriber: Subscriber<T>): Subscription | Function | void {
        if ((this.subscriptions as Subject<Observable<WatchNotification<T>>>).observers.length === 0)
            return this._source.subscribe(subscriber);

        let subscriptionSubject = new Subject<WatchNotification<T>>();
        (this.subscriptions as Subject<Observable<WatchNotification<T>>>).next(subscriptionSubject);

        let subscription = this._source.subscribe({
            next(value) {
                subscriptionSubject.next({kind: 'N', value});
                subscriber.next(value);
            },
            complete() {
                subscriptionSubject.next({kind: 'C'});
                subscriber.complete();
                subscriptionSubject && subscriptionSubject.complete();
                subscriptionSubject = undefined;
            },
            error(error) {
                subscriptionSubject.next({kind: 'E', error});
                subscriber.error(error);
                subscriptionSubject.complete();
                subscriptionSubject = undefined;
            }
        });

        return () => {
            subscription.unsubscribe();
            subscriptionSubject.next({kind: 'U'});
            subscriptionSubject.complete();
            subscriptionSubject = undefined;
        };
    }
}

export function toWatchable<T>(this: Observable<T>): WatchableObservable<T>
export function toWatchable<T>(source: Observable<T>): WatchableObservable<T>
export function toWatchable<T>(this: Observable<T> | undefined, source?: Observable<T>): WatchableObservable<T>
{
    return new WatchableObservable<T>(source || this);
}
