export function* orderOrderedsBy<T, I, R>(
    source: ReadonlyArray<T>,
    mapFn: (value: T, index: number) => ReadonlyArray<I>,
    projectFn: (outer: T, inner: I) => R,
    compareFn: (left: R, right: R) => number
) {
    const innerSources = source.map((x, index) => {
        const innerSource = mapFn(x, index);
        let length = innerSource.length, innerIndex = 0;

        return {
            get closed() { return innerIndex < length; },
            get value() { return projectFn(x, innerSource[innerIndex]); },
            next() { innerIndex++ }
        };
    });

    while (true) {
        const found = innerSources.reduce(
            (acc, inner) =>
                inner.closed ? acc :
                acc.closed ? inner :
                compareFn(acc.value, inner.value) > 0 ? inner : acc
        );
        if (found.closed)
            break;
        
        yield found.value;

        found.next();
    }
}
