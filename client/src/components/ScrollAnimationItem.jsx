
import { useState, useRef, useEffect } from 'react';

const ScrollAnimationItem = ({ children, className = '', delay = 0, style = {}, ...props }) => {
    const [isVisible, setIsVisible] = useState(false);
    const elementRef = useRef(null);

    useEffect(() => {
        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) {
                setIsVisible(true);
                observer.disconnect();
            }
        }, { threshold: 0.1 });

        if (elementRef.current) {
            observer.observe(elementRef.current);
        }

        return () => observer.disconnect();
    }, []);

    return (
        <div
            ref={elementRef}
            className={`scroll-animation-item ${isVisible ? 'is-visible' : ''} ${className}`}
            style={{ ...style, transitionDelay: `${delay}ms` }}
            {...props}
        >
            {children}
        </div>
    );
};

export default ScrollAnimationItem;
