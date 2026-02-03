import React, { createContext, useContext, useState } from 'react';

const AuthModalContext = createContext();

export const useAuthModal = () => {
    const context = useContext(AuthModalContext);
    if (!context) {
        throw new Error('useAuthModal must be used within an AuthModalProvider');
    }
    return context;
};

export const AuthModalProvider = ({ children }) => {
    // null, 'login', 'register'
    const [modalType, setModalType] = useState(null);

    const openLogin = () => setModalType('login');
    const openRegister = () => setModalType('register');
    const openForgotPassword = () => setModalType('forgot-password');
    const closeModal = () => setModalType(null);

    return (
        <AuthModalContext.Provider value={{ modalType, openLogin, openRegister, openForgotPassword, closeModal }}>
            {children}
        </AuthModalContext.Provider>
    );
};
