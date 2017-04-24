export type TimeOrder =
    number |            // [time, 0]
    [number, number];   // [time, order]

export interface TimelineEvent {
    time: TimeOrder;
    event: any;
}

export interface Timeline {
    label?: any;
    startTime?: TimeOrder;
    endTime?: TimeOrder;
    events: TimelineEvent[];
}
