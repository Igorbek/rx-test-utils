import { TestScheduler } from "rxjs/testing/TestScheduler";
import { HotObservable } from "rxjs/testing/HotObservable";
import { Observable } from "rxjs/Observable";
import { Timeline } from "./models/timeline";

interface TestObservableCreator {
    (marble: string, name?: string): Observable<string>;
    <T>(marble: string, values: { [key: string]: T; }): Observable<T>;
}

interface ReactTimelineContext {
    readonly scheduler: TestScheduler;
    hot: TestObservableCreator;
    cold: TestObservableCreator;
    add<T>(source: Observable<T>, name: string): Observable<T>;
}

export function reactiveTimeline(fn: () => void): Timeline {
    const testScheduler = new TestScheduler((a, e) => a === e);
    
}