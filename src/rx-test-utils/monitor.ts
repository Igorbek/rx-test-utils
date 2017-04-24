import { Observer } from 'rxjs/Observer'
import { Observable } from 'rxjs/Observable';

export interface IObservableMonitor<T> {
    subscribe(): IObserverMonitor<T>;
}

export interface IObserverMonitor<T> extends Observer<T> {
    unsubscribe(): void;
}

export function monitored<T>(source: Observable<T>, monitor: IObservableMonitor<T>): Observable<T> {
    return new Observable(observer => {
        const observerMonitor = monitor.subscribe();
        const subscription = source.subscribe(
            value => {
                observerMonitor.next(value);
                observer.next(value);
            },
            error => {
                observerMonitor.error(error);
                observer.error(error);
            },
            () => {
                observerMonitor.complete();
                observer.complete();
            }
        );
        return () => {
            observerMonitor.unsubscribe();
            subscription.unsubscribe();
        }
    });
}
