import 'jest';

import { Timeline } from '../models/timeline'
import { formatSynchronizedTimeline } from '../serializers/synchronized-timeline';


function expectTimelines(...timelines: Timeline[]) {
    const synchronizedTimeline = formatSynchronizedTimeline(timelines);
    expect('\n' + synchronizedTimeline + '\n').toMatchSnapshot();
}

describe('synchronized timeline serializer', () => {
    it('renders labels aligned', () => {
        expectTimelines(
            { label: 'stream', events: [] },
            { label: 'second stream', events: [] },
            { label: 'third stream', events: [] }
        );
    });
    it('renders a single event', () => {
        expectTimelines(
            {
                label: 'stream', events: [
                    { time: 0, event: 'a' }
                ]
            }
        );
    });
    it('renders multiple events of the same order', () => {
        expectTimelines({
            label: 'label',
            events: [
                { time: 0, event: 'a' },
                { time: 0, event: 'b' }
            ]
        });
    });
    it('renders time between events', () => {
        expectTimelines({
            label: 'stream',
            events: [
                { time: 0, event: 'a' },
                { time: 10, event: 'b' }
            ]
        })
    })
    it('renders leading time before first event', () => {
        expectTimelines({
            label: 'stream',
            events: [
                { time: 10, event: 'a' }
            ]
        })
    })
    it('renders events of same time in order', () => {
        expectTimelines({
            label: 'stream 1',
            events: [
                { time: 2, event: 'a' },
                { time: [2, 2], event: 'ab' },
                { time: [4, 1], event: 'c' }
            ]
        }, {
            label: 'stream 2',
            events: [
                { time: [2, 1], event: 'd' },
                { time: [2, 2], event: 'e' },
                { time: 4, event: 'f' }
            ]
        })
    })
    it('renders events of same time and same order', () => {
        expectTimelines({
            label: 'stream 1',
            events: [
                { time: 2, event: 'a' },
                { time: [2, 2], event: 'b' },
            ]
        }, {
            label: 'stream 2',
            events: [
                { time: 2, event: 'd' },
                { time: [2, 2], event: 'e' },
            ]
        })
    })
    it('renders complex timeline', () => {
        expectTimelines({
            label: 'source',
            events: [
                { time: 2, event: 'a' },
                { time: 4, event: 'b' },
                { time: 5, event: 'c' },
                { time: 7, event: 'd' },
                { time: [10, 1], event: 'e' },
            ]
        }, {
            label: 'source subscription',
            startTime: [4, 1],
            endTime: 10,
            events: [
                { time: [4, 1], event: '^' },
                { time: 10, event: '<' },
            ]
        }, {
            label: 'result',
            events: [
                { time: [5, 1], event: 'c' },
                { time: [7, 1], event: 'd' },
            ]
        })
    })
    it('contracts long time', () => {
        expectTimelines({
            label: 'long event',
            events: [
                { time: 1, event: 'a' },
                { time: 50, event: '|' }
            ]
        })
        expectTimelines({
            label: 'long subscription',
            startTime: 50,
            events: [
                { time: 50, event: '^' },
                { time: 100, event: '<' }
            ]
        })
        debugger;
        expectTimelines({
            label: 'stream 1',
            startTime: 50,
            events: [
                { time: 50, event: '^' },
                { time: 100, event: '<' }
            ]
        },
        {
            label: 'stream 2',
            endTime: 80,
            events: []
        })
    })
})
