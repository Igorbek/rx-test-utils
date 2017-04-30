import { Scheduler } from 'rxjs/Scheduler'
import { TimeOrderCoordinator, TimeOrderAccessor } from './recording'

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

export function createTimeOrderAccessor(
    scheduler: Scheduler,
    timeOrderCoordinator: TimeOrderCoordinator = createTimeOrderCoordinator()): TimeOrderAccessor {
    return {
        now() {
            const time = scheduler.now(), order = timeOrderCoordinator.nextOrder(time);
            return [time, order];
        }
    };
}
