// Critically damped follower: bounded travel speed, continuous velocity, no overshoot.
export function createScrollFollower(initial = 0) {
  let position = initial;
  let velocity = 0;
  return {
    reset(value) { position = value; velocity = 0; },
    sample(target, delta, immediate = false) {
      if (immediate) { position = target; velocity = 0; return position; }
      // Small fixed-size steps keep the response consistent across frame rates.
      const steps = Math.max(1, Math.ceil(delta * 120));
      const dt = Math.min(.05, Math.max(0, delta)) / steps;
      const omega = 2 / .22;
      for (let i = 0; i < steps; i++) {
        const change = Math.max(-.45 * .22, Math.min(.45 * .22, position - target));
        const localTarget = position - change;
        const temp = (velocity + omega * change) * dt;
        const decay = Math.exp(-omega * dt);
        velocity = (velocity - omega * temp) * decay;
        const next = localTarget + (change + temp) * decay;
        if ((target - position) * (target - next) <= 0) {
          position = target; velocity = 0;
        } else position = next;
      }
      if (Math.abs(target - position) < .00001 && Math.abs(velocity) < .0001) {
        position = target; velocity = 0;
      }
      return position;
    }
  };
}
