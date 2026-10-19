/** Keyboard activation for non-<button> elements with role="button"; ignores keys bubbling from nested controls. */
export function activateOnEnterOrSpace(e, fn) {
  if (e.target !== e.currentTarget) return;
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    fn();
  }
}
