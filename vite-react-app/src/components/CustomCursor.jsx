import { useEffect, useState, useRef } from 'react';
import './CustomCursor.css';

const CustomCursor = () => {
  const cursorRef = useRef(null);
  const [isHovering, setIsHovering] = useState(false);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const cursor = cursorRef.current;

    const move = (e) => {
      cursor.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
    };

    const show = () => setVisible(true);
    const hide = () => setVisible(false);

    const interactiveEls = document.querySelectorAll('a, button, [data-cursor-hover]');
    const onEnter = () => setIsHovering(true);
    const onLeave = () => setIsHovering(false);

    interactiveEls.forEach(el => {
      el.addEventListener('mouseenter', onEnter);
      el.addEventListener('mouseleave', onLeave);
    });

    window.addEventListener('mousemove', move);
    window.addEventListener('mouseenter', show);
    window.addEventListener('mouseleave', hide);

    return () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseenter', show);
      window.removeEventListener('mouseleave', hide);
      interactiveEls.forEach(el => {
        el.removeEventListener('mouseenter', onEnter);
        el.removeEventListener('mouseleave', onLeave);
      });
    };
  }, []);

  return (
    <div
      ref={cursorRef}
      className={`custom-cursor ${isHovering ? 'hover' : ''} ${!visible ? 'hidden' : ''}`}
    />
  );
};

export default CustomCursor;
