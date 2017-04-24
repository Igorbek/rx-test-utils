import * as Rx from 'rxjs';

export interface SynchronizedTimeline {

}

export interface Timeline {
    label: any;
    events: TimelineEvent[];
}

export interface TimelineEvent {
    time: number;
    order?: number;
    event: any;
}

interface FormatOptions {
    formatEvent?(event: any): string;
    formatLabel?(label: any): string;
    formatTime?(duration: number): string;
    timePadding?: string;
    orderPadding?: string;
    labelPadding?: string;
}

const defaultFormat = (event: any) => event && event.toString ? event.toString() : '?';
const defaultFormatTime = (duration: number) => {
    let result = '';
    while (result.length < duration) {
        result += '-';
    }
    return result;
}

interface TimelineFormatState {
    timeline: Timeline;
    index: number;
    result: string;
}

const padded = (chunk: string, padding: string): [string, string] => [chunk, padding];

export function formatSynchronizedTimeline(
    timelines: Timeline[],
    options: FormatOptions = {}) {

    options.formatEvent = options.formatEvent || defaultFormat;
    options.formatLabel = options.formatLabel || defaultFormat;
    options.formatTime = options.formatTime || defaultFormatTime;
    options.labelPadding = options.labelPadding || ' ';
    options.orderPadding = options.orderPadding || '-';
    options.timePadding = options.timePadding || '-';

    const states = timelines.map(timeline => ({ timeline, index: 0, result: '' }));

    // first create labels
    const labels = timelines.map(timeline => options.formatLabel(timeline.label) + ': ');
    addChunks(states, labels, options.labelPadding);

    // iterate over events
    let maxTime = 0;
    forEachTimeOrder(timelines, ({events, time}) => {
            debugger;
        if (time > maxTime) {
            var timePad = options.formatTime(time - maxTime);
            addChunks(states, timelines.map(_ => timePad), options.timePadding);
            maxTime = time;
        }
        const chunks: Chunks = {};
        events.forEach(({ timelineIndex, eventIndexes }) => {
            var events = eventIndexes.length == 1
                ? options.formatEvent(timelines[timelineIndex].events[eventIndexes[0]].event)
                : '(' + eventIndexes.map(eventIndex => options.formatEvent(timelines[timelineIndex].events[eventIndex].event)).join('|') + ')';
            chunks[timelineIndex] = events;
        })
        addChunks(states, chunks, options.orderPadding);
    });

    const result = states.map(state => state.result).join('\n');

    return result;
}

interface Chunks {
    [index: number]: string;
}

function addChunks(states: TimelineFormatState[], chunks: Chunks, padding: string) {
    const maxLength = states.reduce(
        (acc, _, index) =>
            chunks[index] && chunks[index].length > acc
                ? chunks[index].length
                : acc,
        0);
    debugger;
    states.forEach((state, index) => {
        const chunk = chunks[index] || '';
        state.result += chunk
        let l = maxLength - chunk.length;
        while (l > 0) {
            state.result += padding;
            l -= padding.length;
        }
    })
}

interface TimeOrder {
    events: Array<{
        timelineIndex: number;
        eventIndexes: number[];
    }>;
    time: number;
    order: number;
}

function forEachTimeOrder(
    timelines: Timeline[],
    fn: (timeOrder: TimeOrder) => void): void {

    const indexes = timelines.map(_ => 0);  // create indexes for each timeline

    while (true) {
        const found = timelines.reduce(
            (acc, timeline, timelineIndex) => {
                let eventIndex = indexes[timelineIndex];
                if (eventIndex >= timeline.events.length)
                    return acc;

                const { time, order, event } = timeline.events[eventIndex];

                if (acc.events.length !== 0) {
                    const { time: minTime, order: minOrder } = acc;
                    if (time > minTime)
                        return acc;
                    if (time === minTime && order > minOrder)
                        return acc;
                    if (time < minTime || order < minOrder)
                        acc = { time, order, events: [] };
                }
                else
                    acc = { time, order, events: [] };

                const eventIndexes: number[] = [];
                do {
                    eventIndexes.push(eventIndex++);
                } while (eventIndex < timeline.events.length
                && timeline.events[eventIndex].time === time
                    && timeline.events[eventIndex].order === order);

                return {...acc, events: [...acc.events, { timelineIndex, eventIndexes }] };
            },
            { time: 0, order: 0, events: [] } as TimeOrder);

        if (found.events.length === 0)
            break;

        fn(found);

        found.events.forEach(event => {
            indexes[event.timelineIndex] += event.eventIndexes.length;
        });
    }
}
