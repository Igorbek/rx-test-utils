import { TestMessage } from "rxjs/testing/TestMessage";
import { IScheduler } from 'rxjs/Scheduler';
import { Observable } from 'rxjs/Observable';
import { Notification } from 'rxjs/Notification';

import { IObservableMonitor, IObserverMonitor } from '../monitor';

interface RecordedMessageBase {
    time: number;
    order: number;
}

interface RecordedNextMessage<T> extends RecordedMessageBase {
    kind: 'N';
    value: T;
}

interface RecordedCompleteMessage extends RecordedMessageBase {
    kind: 'C';
}

interface RecordedErrorMessage extends RecordedMessageBase {
    kind: 'E';
    error: any;
}

type RecordedMessage<T> = RecordedNextMessage<T> | RecordedCompleteMessage | RecordedErrorMessage;

interface RecordedSubscription<T> {
    subscribedTime: number;
    subscribedOrder: number;
    unsubscribedTime?: number;
    unsubscribedOrder?: number;
    messages: RecordedMessage<T>[];
}

interface RecordedObservable<T> {
    subscriptions: RecordedSubscription<T>[];
}

export function createRecordingMonitor<T>(
    scheduler: IScheduler,
    timeOrderCoordinator: TimeOrderCoordinator): { monitor: IObservableMonitor<T>; recorded: RecordedObservable<T>; } {
    const recorded: RecordedObservable<T> = {
        subscriptions: []
    };

    const monitor: IObservableMonitor<T> = {
        subscribe() {
            const subscribedTime = scheduler.now(), subscribedOrder = timeOrderCoordinator.nextOrder(subscribedTime);
            const subscription: RecordedSubscription<T> = {
                subscribedTime,
                subscribedOrder,
                messages: []
            };
            recorded.subscriptions.push(subscription);

            return {
                next(value) {
                    const time = scheduler.now(), order = timeOrderCoordinator.nextOrder(time);
                    subscription.messages.push({
                        time,
                        order,
                        kind: 'N',
                        value
                    });
                },
                complete() {
                    const time = scheduler.now(), order = timeOrderCoordinator.nextOrder(time);
                    subscription.messages.push({
                        time,
                        order,
                        kind: 'C'
                    });
                },
                error(error) {
                    const time = scheduler.now(), order = timeOrderCoordinator.nextOrder(time);
                    subscription.messages.push({
                        time,
                        order,
                        kind: 'E',
                        error
                    });
                },
                unsubscribe() {
                    subscription.unsubscribedTime = scheduler.now();
                    subscription.unsubscribedOrder = timeOrderCoordinator.nextOrder(subscription.unsubscribedTime);
                }
            }
        }
    };

    return { monitor, recorded };
}

export interface TimeOrderCoordinator {
    nextOrder(time: number): number;
}

export function createTimeOrderCoordinator(): TimeOrderCoordinator {
    let lastTime = 0;
    let nextOrder = 0;
    return {
        nextOrder(time) {
            if (time < lastTime)
                throw new Error('Previous time was higher than passed.');
            if (time > lastTime) {
                lastTime = time;
                nextOrder = 0;
            }
            return nextOrder++;
        }
    }
}
