import 'jest';

import { TestMessage } from "rxjs/testing/TestMessage";
import { IScheduler } from 'rxjs/Scheduler';
import { Observer, Observable } from 'rxjs'
import { TestScheduler } from 'rxjs/testing/TestScheduler'

import 'rxjs/add/operator/take';
import 'rxjs/add/operator/skip';

import { createTimeOrderAccessor } from '../timeCoordinator';
import { createRecordingObserver } from '../../monitors/recordingObserver';
import { toWatchable } from '../WatchableObservable'

describe('WatchableObservable', () => {
    it('it captures data', () => {
        const testScheduler = new TestScheduler((a, e) => a === e);
        const { observer, recorded } = createRecordingObserver(createTimeOrderAccessor(testScheduler));

        const source = testScheduler.createHotObservable('--1-2-3--4--5-')
        //const observable = monitored(Rx.Observable.interval(10, testScheduler).take(3), monitor);
        const observable = toWatchable(source.take(4));
        observable.subscriptions.subscribe(observer);

        const subscription = observable.subscribe();
        const subscription2 = observable.skip(1).subscribe();
        
        testScheduler.flush();

        expect(recorded).toMatchSnapshot();
    })
})
