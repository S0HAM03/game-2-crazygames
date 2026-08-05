import { useEffect, useRef } from 'react';

export function usePlayerControls() {
  const keys = useRef({});

  useEffect(() => {
    const down = (e) => {
      // Prevent Tab from changing browser element focus
      if (e.code === 'Tab') {
        e.preventDefault();
      }
      keys.current[e.code] = true;
    };

    const up = (e) => {
      if (e.code === 'Tab') {
        e.preventDefault();
      }
      keys.current[e.code] = false;
    };

    window.addEventListener('keydown', down, { capture: true });
    window.addEventListener('keyup', up, { capture: true });

    return () => {
      window.removeEventListener('keydown', down, { capture: true });
      window.removeEventListener('keyup', up, { capture: true });
    };
  }, []);

  return keys;
}
