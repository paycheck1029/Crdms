'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

/**
 * ModalWrapper
 * Renders children through a React Portal to <body>, fully escaping any
 * ancestor stacking context. z-index controlled via --z-modal-backdrop in globals.css.
 *
 * Props:
 *   isOpen             {boolean}   Whether the modal is mounted.
 *   onClose            {function}  Called on Esc key or outside click (if enabled).
 *   children           {node}      Content rendered inside the overlay.
 *   closeOnOutsideClick {boolean}  Default true. Dismiss on backdrop click.
 *   closeOnEsc         {boolean}   Default true. Dismiss on Escape key.
 */
export default function ModalWrapper({
  isOpen,
  onClose,
  children,
  closeOnOutsideClick = true,
  closeOnEsc = true,
}) {
  // SSR / hydration guard — portal requires a real DOM node.
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // Stable ref for onClose — prevents effect teardown loop when caller
  // passes a new arrow function reference each render.
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  const dialogRef = useRef(null);
  const previousActiveElementRef = useRef(null);

  // Scroll-lock + Escape listener
  useEffect(() => {
    if (!isOpen || !mounted) return;

    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e) => {
      if (closeOnEsc && e.key === 'Escape') {
        onCloseRef.current?.();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      // Only restore scroll when this is the last active overlay
      // (checked post-unmount via setTimeout to let DOM settle first).
      setTimeout(() => {
        if (!document.querySelector('.modal-overlay')) {
          document.body.style.overflow = '';
        }
      }, 0);
    };
  }, [isOpen, mounted, closeOnEsc]);

  // Focus management: store previous active element, focus dialog, restore on close/unmount
  useEffect(() => {
    if (isOpen && mounted) {
      previousActiveElementRef.current = document.activeElement;
      if (dialogRef.current) {
        dialogRef.current.focus();
      }
    }

    return () => {
      if (previousActiveElementRef.current) {
        const elementToFocus = previousActiveElementRef.current;
        setTimeout(() => {
          elementToFocus.focus?.();
        }, 0);
      }
    };
  }, [isOpen, mounted]);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div
      className="modal-overlay"
      role="presentation"
      onClick={(e) => {
        if (closeOnOutsideClick && e.target === e.currentTarget) {
          onCloseRef.current?.();
        }
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
        style={{ width: '100%', display: 'contents', outline: 'none' }}
      >
        {children}
      </div>
    </div>,
    document.body
  );
}
