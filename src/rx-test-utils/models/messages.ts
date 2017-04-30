import {Observable } from 'rxjs';

export interface WatchedObservable<T> extends Observable<T> {
    readonly subscriptions: Observable<Observable<WatchNotification<T>>>;
}

export type WatchNotification<T> =
    { kind: 'N'; value: T; } |
    { kind: 'C'; } |
    { kind: 'E'; error: any; } |
    { kind: 'U'; }
