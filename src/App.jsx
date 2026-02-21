import React, { useState, useCallback, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import AppLayout from './components/AppLayout';
import Toast from './components/Toast';
import Dashboard from './pages/Dashboard';
import Settings from './pages/Settings';
import Poller from './utils/poller';

export default function App() {
    const [toasts, setToasts] = useState([]);

    const addToast = useCallback((toast) => {
        const id = Date.now() + Math.random();
        setToasts(prev => [...prev, { ...toast, id }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 6000);
    }, []);

    const removeToast = useCallback((id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    useEffect(() => {
        Poller.setToastCallback(addToast);
        Poller.start();
        return () => Poller.stop();
    }, [addToast]);

    return (
        <>
            <AppLayout>
                <Routes>
                    <Route path="/" element={<Dashboard addToast={addToast} />} />
                    <Route path="/settings" element={<Settings addToast={addToast} />} />
                </Routes>
            </AppLayout>
            <Toast toasts={toasts} onRemove={removeToast} />
        </>
    );
}
