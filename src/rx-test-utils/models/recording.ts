import { WatchNotification } from './messages'

export interface TimeOrderCoordinator {
    nextOrder(time: number): number;
}

export interface TimeOrderAccessor {
    now(): [number, number];
}

export interface RecordedNotification<T> {
    time: [number, number];
    notification: WatchNotification<T>;
}

export interface RecordedSubscription<T> {
    subscribed: [number, number];
    unsubscribed?: [number, number];
    notifications: RecordedNotification<T>[];
}

export interface RecordedObservable<T> {
    subscriptions: RecordedSubscription<T>[];
}
