import { Observer } from 'rxjs/Observer'
import { Observable } from 'rxjs/Observable'
import { Scheduler } from 'rxjs/Scheduler';

import { WatchNotification } from '../models/messages'
import { RecordedObservable, RecordedSubscription, TimeOrderAccessor } from '../models/recording'

export function createRecordingObserver<T>(
    timeOrderAccessor: TimeOrderAccessor
): {
    observer: Observer<Observable<WatchNotification<T>>>;
    recorded: RecordedObservable<T>;
} {
    const recorded: RecordedObservable<T> = {
        subscriptions: []
    };

    const observer: Observer<Observable<WatchNotification<T>>> = {
        next(value) {
            const {
                observer: subscriptionObserver,
                recorded: recordedSubscription
            } = createRecordingSubscriptionObserver<T>(timeOrderAccessor);
            recorded.subscriptions.push(recordedSubscription);
            value.subscribe(subscriptionObserver);
        },
        complete() {
        },
        error(error) {
            throw error;
        }
    };

    return { observer, recorded };
}

export function createRecordingSubscriptionObserver<T>(
    timeOrderAccessor: TimeOrderAccessor
): {
    observer: Observer<WatchNotification<T>>;
    recorded: RecordedSubscription<T>;
} {
    const recorded: RecordedSubscription<T> = {
        notifications: [],
        subscribed: timeOrderAccessor.now()
    };

    const observer: Observer<WatchNotification<T>> = {
        next(notification) {
            const time = timeOrderAccessor.now()
            recorded.notifications.push({
                time,
                notification
            });
            if (notification.kind === 'U') {
                recorded.unsubscribed = time;
            }
        },
        complete() {
        },
        error(error) {
            throw error;
        }
    };

    return { observer, recorded };
}
