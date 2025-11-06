"use client"

import React from 'react';

type ModalProps = {
    isOpen?: boolean;
    onClose?: () => void;
    onOk?: () => void;
    message?: string;
    showCancelButton?: boolean;
    okText?: string;
    cancelText?: string;
    children?: React.ReactNode; // Add children prop
};

const Modal = ({ isOpen, onClose, onOk, message, showCancelButton, okText, cancelText, children }: ModalProps) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-shadowcolor flex justify-center items-center z-50">
            <div className="bg-surface text-textprimary p-4 rounded-lg shadow-lg max-w-lg w-full max-h-[80vh] flex flex-col">
                <div className="flex-grow overflow-y-auto">
                    {children ? children : <p>{message}</p>} 
                </div>
                <div className="flex justify-end gap-x-4 mt-4 flex-shrink-0">
                    {onClose && !showCancelButton && (
                        <button onClick={onClose} className="bg-primary text-textprimary rounded-lg px-4 py-2">
                            {okText || "OK"}
                        </button>
                    )}
                    {onOk && (
                        <button onClick={onOk} className="bg-primary text-textprimary rounded-lg px-4 py-2">
                            {okText || "OK"}
                        </button>
                    )}
                    {showCancelButton && (
                        <button
                            className={`
                                px-4 py-2 
                                border-none rounded-md 
                                cursor-pointer 
                                bg-destructive text-textprimary
                            `}
                            onClick={onClose}
                        >
                            {cancelText || "Cancel"}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Modal;