import 'jest';

import * as Rx from 'rxjs';
import { TestMessage } from "rxjs/testing/TestMessage";
import { IScheduler } from 'rxjs/Scheduler';
import { Observer } from 'rxjs/Observer'
import { Observable } from 'rxjs/Observable';

import { createRecordingMonitor, createTimeOrderCoordinator } from '../monitors/recording';
import { monitored } from '../monitor';

describe('monitor', () => {
    it('it captures data', () => {
        const testScheduler = new Rx.TestScheduler((a, e) => a === e);
        const { monitor, recorded } = createRecordingMonitor(testScheduler, createTimeOrderCoordinator());

        const source = testScheduler.createHotObservable('--1-2-3--4--5-')
        //const observable = monitored(Rx.Observable.interval(10, testScheduler).take(3), monitor);
        const observable = monitored(source.take(4), monitor);

        const subscription = observable.subscribe();
        const subscription2 = observable.skip(1).subscribe();
        
        //testScheduler.schedule(() => { console.log('done') }, 100);
        testScheduler.flush();

        expect(recorded).toMatchSnapshot();
    })
})
