import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../App.css';

export default function LandingPage() {
    const navigate = useNavigate();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [username, setUsername] = useState("");

    useEffect(() => {
        const token = localStorage.getItem("token");
        const savedUsername = localStorage.getItem("username");

        if (token) {
            setIsAuthenticated(true);
            setUsername(savedUsername || "User"); // Fallback if username wasn't saved
        }
    }, []);

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("username");
        setIsAuthenticated(false);
        setUsername("");
        // Optionally reload or navigate to ensure state clears everywhere
        window.location.reload();
    };

    const joinAsGuest = () => {
        // Generate a random 6-character room code
        const randomRoomId = Math.random().toString(36).substring(2, 8);
        navigate(`/${randomRoomId}`);
    };

    return (
        <div className="landingPageContainer">
            <nav className="navHeader">
                <div className="navLogo">
                    <h3>VertualMeetup</h3>
                </div>
                <div className="navLinks">
                    {isAuthenticated ? (
                        <>
                            <p>Welcome, <span style={{ fontWeight: '600', color: '#ff2d55' }}>{username}</span>!</p>
                            <div className="btn-primary" onClick={handleLogout}>Logout</div>
                        </>
                    ) : (
                        <>
                            <div onClick={joinAsGuest} style={{ cursor: 'pointer' }}>Join as Guest</div>
                            <Link to="/auth">Register</Link>
                            <Link to="/auth" className="btn-primary">Login</Link>
                        </>
                    )}
                </div>
            </nav>

            <div className="landingMainContainer">
                <div className="landingContent">
                    <h1 className="text-gradient">Connect With Your Loved Ones</h1>
                    <p>Experience seamless, high-quality video calls with a premium touch. Simple, secure, and beautiful.</p>
                    <div className="actionButtons">
                        <div className="btn-primary" onClick={() => {
                            if (isAuthenticated) joinAsGuest();
                            else navigate("/auth");
                        }} style={{ cursor: 'pointer' }}>
                            Get Started
                        </div>
                        <div className="btn-ghost" onClick={() => {
                            navigate("/join-meet");
                        }} style={{ cursor: 'pointer' }}>
                            Join Meeting
                        </div>
                    </div>
                </div>

                <div className="landingImage">
                    <img src="/mobile.png" alt="Mobile App View" />
                </div>
            </div>
        </div>
    );
}
