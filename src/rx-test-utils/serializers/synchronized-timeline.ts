import { Observable } from 'rxjs/Observable';

import { Timeline, TimelineEvent, TimeOrder as InputTimeOrder } from '../models/timeline';
import { orderOrderedsBy } from '../utils/orderBy';

type TimeOrder = [number, number];

interface FormatOptions {
    formatEvent?(event: any, requiredLength?: number): string;
    formatLabel?(label: any, requiredLength?: number): string;
    formatTime?(duration: number, active: boolean, requiredLength?: number): string;
    timePadding?: string;
    orderPadding?: string;
    labelPadding?: string;
}

const defaultEventFormat = (event: any, requiredLength?: number) => {
    let result = event && event.toString ? event.toString() : '?';
    if (result.length !== 1)
        result = '(' + result + ')';
    while (result.length < requiredLength) {
        result += '-';
    }
    return result;
};

function repeatString(str: string, requiredLength: number) {
    let result = '';
    while (result.length < requiredLength) {
        result += str;
    }
    if (result.length > requiredLength)
        result = result.substr(0, requiredLength);
    return result;
}

const defaultFormatTime = (duration: number, active: boolean, requiredLength?: number) => {
    if (!active)
        return repeatString(' ', requiredLength || 0);

    const padding = active ? '-' : ' ';
    if (!requiredLength && duration > 10 || requiredLength < duration) {
        let result = `---~${duration - 8}~---`;

        if (result.length < duration) {
            if (requiredLength && requiredLength > result.length) {
                const toAdd = requiredLength - result.length;
                const toAddLeft = (toAdd - toAdd % 2) / 2;
                result = repeatString(padding, toAddLeft) + result + repeatString(padding, toAdd - toAddLeft);
            }

            return result;
        }
    }

    return repeatString(padding, requiredLength || duration);
}

const defaultFormatLabel = (label: any, requiredLength?: number) => {
    let result = `${label}: `;

    if (requiredLength !== undefined) {
        while (result.length < requiredLength) {
            result = ' ' + result;
        }
    }

    return result;
};

const compareNumber = (left: number, right: number) => left < right ? -1 : left > right ? 1 : 0;
const normalizeTimeOrder = (timeOrder: InputTimeOrder): TimeOrder => typeof timeOrder === 'number' ? [timeOrder, 0] : timeOrder;
const compareTimeOrder = (left: TimeOrder, right: TimeOrder) =>
    compareNumber(left[0], right[0]) || compareNumber(left[1], right[1]);
const compareInputTimeOrder = (left: InputTimeOrder, right: InputTimeOrder) =>
    compareTimeOrder(normalizeTimeOrder(left), normalizeTimeOrder(right));

export function formatSynchronizedTimeline(
    timelines: Timeline[],
    options: FormatOptions = {}) {

    options.formatEvent = options.formatEvent || defaultEventFormat;
    options.formatLabel = options.formatLabel || defaultFormatLabel;
    options.formatTime = options.formatTime || defaultFormatTime;
    options.labelPadding = options.labelPadding || ' ';
    options.orderPadding = options.orderPadding || ' ';
    options.timePadding = options.timePadding || '-';

    const timelineStates = timelines
        .map((timeline, timelineIndex) => {
            const startTime = normalizeTimeOrder(timeline.startTime || 0);
            const active = startTime[0] === 0 && startTime[1] === 0;

            return { timeline, startTime, active };
        });

    const allEvents = timelineStates
        .map(({ timeline, startTime, active }, timelineIndex) => {
            const events = timeline.events.map((event, eventIndex) => ({ timelineIndex, eventIndex, time: normalizeTimeOrder(event.time) }));

            if (!active)
                events.push({ timelineIndex, eventIndex: -1, time: startTime });
            if (timeline.endTime)
                events.push({ timelineIndex, eventIndex: -2, time: normalizeTimeOrder(timeline.endTime) });

            return events;
        })
        .reduce((acc, next) => acc.concat(next))
        .sort((a, b) => compareTimeOrder(a.time, b.time) || compareNumber(a.timelineIndex, b.timelineIndex));

    const table = createTable(timelines);

    table.addLabelColumn(timelines.map(timeline => timeline.label));

    let lastTime: TimeOrder = [0, 0];
    let lastColumnTimelineIndex: number | undefined;

    allEvents.forEach(({ timelineIndex, eventIndex, time }) => {
        const timelineState = timelineStates[timelineIndex];

        if (compareTimeOrder(time, lastTime) < 0) {
            throw 'Invalid order of events';
        }

        const duration = time[0] - lastTime[0];
        if (duration > 0) {
            // need to create new time columns
            table.addTimeColumn(duration, timelineStates.map(s => s.active));
            lastTime = time;
        }

        if (eventIndex < 0) { // activate/deactivate timeline
            timelineState.active = eventIndex === -1;
        }
        else {
            const event = timelineState.timeline.events[eventIndex];
            const lastEventColumn = table.getOrAddEventColumn(time, timelineIndex);
            lastEventColumn.addEvent(timelineIndex, event.event);
        }
    });

    return table.format(options);
}

interface ColumnBase {
    kind: string;
    requiredLength?: number;
    getRequiredLength(options: FormatOptions, columnIndex: number, getColumn: (columnIndex: number) => ColumnBase): number;
    format(options: FormatOptions, timelineIndex: number, requiredLength: number, columnIndex: number, getColumn: (columnIndex: number) => ColumnBase): [number, string];
}

interface TableBase {
    timelines: Timeline[];
    columns: ColumnBase[];
    addLabelColumn(timelineLabels: any[]): LabelColumn;
    addTimeColumn(duration: number, timelinesActive: boolean[]): TimeColumn;
    getOrAddEventColumn(time: TimeOrder, timelineIndex: number): EventColumn;
    format(options: FormatOptions): string;
    lines?: string[];
}

interface LabelColumn extends ColumnBase {
    kind: 'label';
    timelineLabels: any[];
}

interface TimeColumn extends ColumnBase {
    kind: 'time';
    duration: number;
    timelinesActive: boolean[];
}

interface EventColumn extends ColumnBase {
    kind: 'event';
    time: TimeOrder;
    lastTimelineIndex?: number;
    timelineEvents: any[];
    addEvent(timelineIndex: number, event: any): void;
}

function createTable(timelines: Timeline[]): TableBase {
    const columns: ColumnBase[] = [];
    let lastEventColumn: EventColumn | undefined;
    return {
        timelines,
        columns,
        addLabelColumn(timelineLabels) {
            const column: LabelColumn = {
                kind: 'label',
                timelineLabels,
                getRequiredLength: (options) => max(
                    column.timelineLabels.map(label => options.formatLabel(label).length),
                    compareNumber
                ),
                format: (options, timelineIndex, requiredLength) =>
                    [1, options.formatLabel(column.timelineLabels[timelineIndex], requiredLength)]
            };
            columns.push(column);
            return column;
        },
        addTimeColumn(duration, timelinesActive) {
            const column: TimeColumn = {
                kind: 'time',
                duration,
                timelinesActive,
                getRequiredLength: (options, columnIndex, getColumn) =>
                    options.formatTime(duration, timelinesActive.some(active => active)).length,
                format: (options, timelineIndex, _, columnIndex, getColumn) => {
                        let count = 0;
                        let result = '';
                        let duration = 0;
                        let requiredLength = 0;
                        
                        const active = timelinesActive[timelineIndex];
                        let nextColumn = column as ColumnBase | undefined;
                        while (nextColumn !== undefined) {
                            if (isTimeColumn(nextColumn) && nextColumn.timelinesActive[timelineIndex] === active) {
                                duration += nextColumn.duration;
                            }
                            else if (isEventColumn(nextColumn) && nextColumn.timelineEvents[timelineIndex] === undefined) {
                            }
                            else {
                                break;
                            }

                            requiredLength += nextColumn.requiredLength;
                            count++;
                            nextColumn = getColumn(columnIndex + count);
                        }
                        
                        return [count, options.formatTime(duration, active, requiredLength)];
                    }
            }
            columns.push(column);
            return column;
        },
        getOrAddEventColumn(time, timelineIndex) {
            if (lastEventColumn !== undefined
                && lastEventColumn.time[0] === time[0]
                && (lastEventColumn.lastTimelineIndex === undefined
                    || lastEventColumn.lastTimelineIndex < timelineIndex)) {
                return lastEventColumn;
            }
            const column: EventColumn = {
                kind: 'event',
                time,
                timelineEvents: new Array(timelines.length),
                getRequiredLength: (options) => max(
                    column.timelineEvents.map(event => event === undefined ? 0 : options.formatEvent(event).length),
                    compareNumber),
                format: (options, timelineIndex, requiredLength) =>
                    {
                        const event = column.timelineEvents[timelineIndex];
                        return [1, event === undefined ? repeatString(options.orderPadding, requiredLength) : options.formatEvent(event, requiredLength)]
                    },
                addEvent(timelineIndex, event) {
                    if (column.lastTimelineIndex !== undefined && column.lastTimelineIndex >= timelineIndex)
                        throw 'Event cannot be added to the column';
                    column.timelineEvents[timelineIndex] = event;
                    column.lastTimelineIndex = timelineIndex;
                }
            };
            lastEventColumn = column;
            columns.push(column);
            return column;
        },
        format(options) {
            const getColumn = (columnIndex: number) =>
                columnIndex >= 0 && columnIndex < columns.length
                    ? columns[columnIndex]
                    : undefined;

            // calculate lengths of each column
            columns.forEach((column, columnIndex) => {
                column.requiredLength = column.getRequiredLength(options, columnIndex, getColumn);
            });

            const lines = timelines.map((timeline, timelineIndex) => {

                let pendingConsumedCount = 0;
                return columns.map((column, columnIndex) => {
                    debugger;
                    const [consumed, result] = pendingConsumedCount == 0
                        ? column.format(options, timelineIndex, column.requiredLength, columnIndex, getColumn)
                        : [0, ''];

                    pendingConsumedCount += consumed;
                    pendingConsumedCount--;

                    return result;
                }).join('');
            });

            this.lines = lines;

            return lines.join('\n');
        }
    };
}

function isLabelColumn(column: ColumnBase): column is LabelColumn {
    return column.kind === 'label';
}
function isTimeColumn(column: ColumnBase): column is TimeColumn {
    return column.kind === 'time';
}
function isEventColumn(column: ColumnBase): column is EventColumn {
    return column.kind === 'event';
}

function min<T>(data: ReadonlyArray<T>, compareFn: (left: T, right: T) => number): T {
    return data.reduce((left, right) => compareFn(left, right) > 0 ? right : left);
}
function max<T>(data: ReadonlyArray<T>, compareFn: (left: T, right: T) => number): T {
    return data.reduce((left, right) => compareFn(left, right) < 0 ? right : left);
}
