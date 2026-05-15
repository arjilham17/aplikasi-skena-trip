import React, { useCallback, useEffect, useRef } from "react";
import gsap from "gsap";
import { cn } from "../../utils/cn";

export const LayeredStack = ({ children, className, ...props }) => {
    const containerRef = useRef(null);
    const isStacked = useRef(true);

    const stackCards = useCallback((animate = true) => {
        const container = containerRef.current;
        if (!container) return;

        isStacked.current = true;
        const cards = Array.from(container.children);

        // First clear all transforms so offsetLeft/offsetTop reflect true grid positions
        cards.forEach((card) => {
            gsap.killTweensOf(card);
        });

        if (!animate) {
            // Instant reposition: clear transforms, recalculate, set immediately
            cards.forEach((card) => gsap.set(card, { x: 0, y: 0, rotate: 0 }));
            // Wait a frame so the browser recalculates layout
            requestAnimationFrame(() => {
                const container = containerRef.current;
                if (!container || !isStacked.current) return;
                const cards = Array.from(container.children);
                cards.forEach((card, i) => {
                    const offsetX = container.clientWidth / 2 - card.offsetWidth / 2 - card.offsetLeft;
                    const offsetY = container.clientHeight / 2 - card.offsetHeight / 2 - card.offsetTop;
                    gsap.set(card, {
                        x: offsetX,
                        y: offsetY,
                        rotate: gsap.utils.random(-10, 10),
                        zIndex: 100 - i,
                    });
                });
            });
            return;
        }

        // Animated: first clear, then after layout recalc, animate to center
        cards.forEach((card) => gsap.set(card, { x: 0, y: 0, rotate: 0 }));
        requestAnimationFrame(() => {
            const container = containerRef.current;
            if (!container || !isStacked.current) return;
            const cards = Array.from(container.children);
            cards.forEach((card, i) => {
                const offsetX = container.clientWidth / 2 - card.offsetWidth / 2 - card.offsetLeft;
                const offsetY = container.clientHeight / 2 - card.offsetTop - card.offsetHeight / 2;
                gsap.to(card, {
                    x: offsetX,
                    y: offsetY,
                    rotate: gsap.utils.random(-10, 10),
                    zIndex: 100 - i,
                    duration: 0.8,
                    ease: "expo.out",
                    overwrite: true,
                });
            });
        });
    }, []);

    const resetCards = useCallback(() => {
        const container = containerRef.current;
        if (!container) return;

        isStacked.current = false;
        const cards = Array.from(container.children);

        gsap.to(cards, {
            x: 0,
            y: 0,
            zIndex: (i) => 100 - i,
            duration: 0.8,
            rotate: 0,
            ease: "expo.out",
            stagger: {
                amount: 0.1,
                from: "start",
            },
            overwrite: true,
        });
    }, []);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        // Initial z-index setup
        const cards = Array.from(container.children);
        cards.forEach((card, i) => {
            gsap.set(card, { zIndex: 100 - i });
        });

        stackCards();

        // Re-run current state on resize
        const ro = new ResizeObserver(() => {
            if (isStacked.current) {
                stackCards(false);
            }
        });
        ro.observe(container);

        return () => ro.disconnect();
    }, [stackCards]);

    return (
        <div
            ref={containerRef}
            onMouseEnter={resetCards}
            onMouseLeave={() => stackCards(true)}
            className={cn("relative", className)}
            {...props}>
            {children}
        </div>
    );
};
