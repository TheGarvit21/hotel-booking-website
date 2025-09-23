import { useEffect, useState } from 'react';
import { checkUserPermissions, getCurrentUser } from '../utils/auth';
import './UserStatusBanner.css';

const UserStatusBanner = () => {
    const [user, setUser] = useState(null);
    const [permissions, setPermissions] = useState(null);

    useEffect(() => {
        const loadUser = async () => {
            try {
                const currentUser = await getCurrentUser();
                if (currentUser) {
                    setUser(currentUser);
                    setPermissions(checkUserPermissions(currentUser));
                }
            } catch (error) {
                console.error('Error loading user:', error);
            }
        };

        loadUser();

        // Listen for auth changes
        const handleAuthChange = (e) => {
            const updatedUser = e?.detail?.user;
            if (updatedUser) {
                setUser(updatedUser);
                setPermissions(checkUserPermissions(updatedUser));
            } else {
                setUser(null);
                setPermissions(null);
            }
        };

        window.addEventListener('auth:change', handleAuthChange);
        return () => window.removeEventListener('auth:change', handleAuthChange);
    }, []);

    // Don't show banner if user is not logged in or is active
    if (!user || !permissions || !permissions.isRestricted) {
        return null;
    }

    return (
        <div className="user-status-banner">
            <div className="banner-content">
                <div className="banner-icon">
                    ⚠️
                </div>
                <div className="banner-message">
                    <strong>Account Status: {user.status === 'inactive' ? 'Temporarily Deactivated' : 'Restricted'}</strong>
                    <p>{permissions.message}</p>
                </div>
                <div className="banner-actions">
                    <a
                        href="mailto:support@luxstay.com"
                        className="support-link"
                        onClick={(e) => {
                            e.preventDefault();
                            window.location.href = 'mailto:support@luxstay.com?subject=Account Status Inquiry&body=Hello, I would like to inquire about my account status. My email is: ' + user.email;
                        }}
                    >
                        Contact Support
                    </a>
                </div>
            </div>
        </div>
    );
};

export default UserStatusBanner;
