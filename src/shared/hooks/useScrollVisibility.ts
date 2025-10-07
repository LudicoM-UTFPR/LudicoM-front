import { useEffect, useRef, useCallback } from "react";

/**
 * Hook customizado para controlar a visibilidade de elementos baseado no scroll
 */
export const useScrollVisibility = (threshold: number = 64): React.RefObject<HTMLElement | null> => {
    const elementRef = useRef<HTMLElement | null>(null);
    const lastScrollYRef = useRef<number>(0);

    const handleScroll = useCallback((): void => {
        const currentScrollY = window.pageYOffset;
        const element = elementRef.current;

        if (element) {
            if (currentScrollY > lastScrollYRef.current && currentScrollY > threshold) {
                element.style.transform = "translateY(-100%)";
            } else {
                element.style.transform = "translateY(0)";
            }
            lastScrollYRef.current = currentScrollY;
        }
    }, [threshold]);

    useEffect(() => {
        // Throttle scroll events for better performance
        let ticking = false;
        
        const handleScrollThrottled = (): void => {
            if (!ticking) {
                requestAnimationFrame(() => {
                    handleScroll();
                    ticking = false;
                });
                ticking = true;
            }
        };

        window.addEventListener("scroll", handleScrollThrottled, { passive: true });
        return () => window.removeEventListener("scroll", handleScrollThrottled);
    }, [handleScroll]);

    return elementRef;
};

export default useScrollVisibility;