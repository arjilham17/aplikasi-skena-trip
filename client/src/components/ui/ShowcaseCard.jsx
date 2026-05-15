"use client"

import * as React from "react"
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion"
import { cn } from "../../utils/cn"

export function ShowcaseCard({
    tagline,
    heading,
    description,
    imageUrl,
    imageAlt = "Showcase image",
    ctaText,
    onCtaClick,
    brandName,
    services = [],
    className,
    enableTilt = true,
    maxTilt = 8,
    enableParallax = true,
}) {
    const cardRef = React.useRef(null)
    const [isHovered, setIsHovered] = React.useState(false)

    const mouseX = useMotionValue(0)
    const mouseY = useMotionValue(0)

    const springConfig = { damping: 25, stiffness: 150 }
    const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [maxTilt, -maxTilt]), springConfig)
    const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-maxTilt, maxTilt]), springConfig)

    const parallaxX = useSpring(useTransform(mouseX, [-0.5, 0.5], [-15, 15]), springConfig)
    const parallaxY = useSpring(useTransform(mouseY, [-0.5, 0.5], [-15, 15]), springConfig)

    const glowX = useSpring(useTransform(mouseX, [-0.5, 0.5], [0, 100]), springConfig)
    const glowY = useSpring(useTransform(mouseY, [-0.5, 0.5], [0, 100]), springConfig)

    const handleMouseMove = React.useCallback(
        (e) => {
            if (!cardRef.current || !enableTilt) return

            const rect = cardRef.current.getBoundingClientRect()
            const x = (e.clientX - rect.left) / rect.width - 0.5
            const y = (e.clientY - rect.top) / rect.height - 0.5

            mouseX.set(x)
            mouseY.set(y)
        },
        [mouseX, mouseY, enableTilt]
    )

    const handleMouseEnter = () => setIsHovered(true)
    const handleMouseLeave = () => {
        setIsHovered(false)
        mouseX.set(0)
        mouseY.set(0)
    }

    return (
        <motion.div
            ref={cardRef}
            className={cn("showcase-card", className)}
            style={{
                position: 'relative',
                width: '100%',
                borderRadius: '24px',
                overflow: 'hidden',
                backgroundColor: 'var(--bg-white)',
                boxShadow: 'var(--shadow-lg)',
                cursor: 'pointer',
                userSelect: 'none',
                transformStyle: "preserve-3d",
                perspective: 1000,
                rotateX: enableTilt ? rotateX : 0,
                rotateY: enableTilt ? rotateY : 0,
            }}
            onMouseMove={handleMouseMove}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
            whileHover={{
                scale: 1.02,
                boxShadow: "0 40px 80px -20px rgba(0,0,0,0.5)",
            }}
        >
            {/* Subtle glow overlay on hover */}
            <motion.div
                style={{
                    position: 'absolute',
                    inset: 0,
                    zIndex: 10,
                    pointerEvents: 'none',
                    background: `radial-gradient(circle at ${glowX.get()}% ${glowY.get()}%, var(--accent) 0%, transparent 50%)`,
                    opacity: 0.1,
                }}
                animate={{ opacity: isHovered ? 1 : 0 }}
                transition={{ duration: 0.3 }}
            />

            {/* Image Section */}
            <div style={{ position: 'relative', aspectRatio: '4/3', overflow: 'hidden' }}>
                {tagline && (
                    <motion.div
                        style={{ position: 'absolute', top: '16px', left: '16px', zIndex: 20 }}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2, duration: 0.5 }}
                    >
                        <span style={{ color: 'var(--on-primary)', fontSize: '14px', fontWeight: '500', letterSpacing: '-0.02em', background: 'var(--primary)', padding: '4px 12px', borderRadius: '20px', boxShadow: 'var(--shadow-sm)' }}>
                            {tagline}
                        </span>
                    </motion.div>
                )}

                <motion.div
                    style={{
                        position: 'absolute',
                        inset: 0,
                        x: enableParallax ? parallaxX : 0,
                        y: enableParallax ? parallaxY : 0,
                        scale: 1.1,
                    }}
                >
                    <motion.img
                        src={imageUrl}
                        alt={imageAlt}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        initial={{ scale: 1.2 }}
                        animate={{ scale: isHovered ? 1.15 : 1.1 }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                    />
                </motion.div>

                {/* Gradient overlay */}
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, var(--bg-white), transparent)', opacity: 0.9 }} />
            </div>

            {/* Content Section */}
            <div style={{ position: 'relative', zIndex: 10, padding: '0 24px 24px 24px', marginTop: '-32px' }}>
                <motion.h2
                    style={{ fontSize: '24px', fontWeight: '600', color: 'var(--text-main)', letterSpacing: '-0.02em', lineHeight: '1.2', marginBottom: '8px', fontFamily: 'Cormorant Garamond' }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                >
                    {heading}
                </motion.h2>

                {description && (
                    <motion.p
                        style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '24px', lineHeight: '1.6' }}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4, duration: 0.5 }}
                    >
                        {description}
                    </motion.p>
                )}

                {ctaText && (
                    <motion.button
                        onClick={onCtaClick}
                        style={{
                            position: 'relative',
                            padding: '8px 20px',
                            borderRadius: '9999px',
                            fontSize: '14px',
                            fontWeight: '500',
                            backgroundColor: 'var(--primary)',
                            color: 'var(--on-primary)',
                            border: '1px solid var(--border)',
                            overflow: 'hidden',
                            cursor: 'pointer',
                            display: 'inline-block'
                        }}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5, duration: 0.5 }}
                        whileHover={{ scale: 1.05, borderColor: 'var(--accent)' }}
                        whileTap={{ scale: 0.98 }}
                    >
                        <motion.span
                            style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.1), transparent)', x: isHovered ? "200%" : "-100%" }}
                            transition={{ duration: 0.6, ease: "easeInOut" }}
                        />
                        <span style={{ position: 'relative', zIndex: 10 }}>{ctaText}</span>
                    </motion.button>
                )}
            </div>

            {/* Footer Section */}
            {(brandName || services.length > 0) && (
                <motion.div
                    style={{ padding: '16px 24px', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6, duration: 0.5 }}
                >
                    {brandName && (
                        <motion.span
                            style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '500' }}
                            whileHover={{ color: "var(--text-main)" }}
                            transition={{ duration: 0.2 }}
                        >
                            {brandName}
                        </motion.span>
                    )}

                    {services.length > 0 && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            {services.map((service, index) => (
                                <React.Fragment key={service}>
                                    <motion.span
                                        style={{ fontSize: '12px', color: 'var(--text-muted)' }}
                                        whileHover={{ color: "var(--text-main)", scale: 1.05 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        {service}
                                    </motion.span>
                                    {index < services.length - 1 && (
                                        <motion.span
                                            style={{ color: 'var(--border)' }}
                                            initial={{ rotate: 0 }}
                                            whileHover={{ rotate: 90 }}
                                            transition={{ duration: 0.3 }}
                                        >
                                            ✦
                                        </motion.span>
                                    )}
                                </React.Fragment>
                            ))}
                        </div>
                    )}
                </motion.div>
            )}

            <motion.div
                style={{
                    position: 'absolute',
                    inset: 0,
                    borderRadius: '24px',
                    pointerEvents: 'none',
                    border: '1px solid var(--border)'
                }}
                animate={{
                    borderColor: isHovered ? "var(--accent)" : "var(--border)"
                }}
                transition={{ duration: 0.3 }}
            />
        </motion.div>
    )
}
