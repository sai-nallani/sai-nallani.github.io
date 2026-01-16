"use client";

import { useEffect } from "react";

interface LightboxProps {
    src: string;
    alt: string;
    isOpen: boolean;
    onClose: () => void;
}

export default function Lightbox({ src, alt, isOpen, onClose }: LightboxProps) {
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };

        if (isOpen) {
            document.addEventListener("keydown", handleEscape);
            document.body.style.overflow = "hidden";
        }

        return () => {
            document.removeEventListener("keydown", handleEscape);
            document.body.style.overflow = "";
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="lightbox active" onClick={onClose}>
            <span className="lightbox-close">&times;</span>
            <img src={src} alt={alt} onClick={(e) => e.stopPropagation()} />
        </div>
    );
}
