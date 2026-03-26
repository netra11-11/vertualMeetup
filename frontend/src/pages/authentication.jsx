import * as React from 'react';
import './Authentication.css';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function Authentication() {
  const [isRightPanelActive, setIsRightPanelActive] = React.useState(false);
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [name, setName] = React.useState("");
  const [error, setError] = React.useState("");
  const [message, setMessage] = React.useState("");

  const navigate = useNavigate();

  const handleSignUpClick = () => {
    setIsRightPanelActive(true);
    setError("");
    setMessage("");
  };

  const handleSignInClick = () => {
    setIsRightPanelActive(false);
    setError("");
    setMessage("");
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      // Clear previous messages
      setError("");
      setMessage("");

      const response = await axios.post("http://localhost:8000/api/v1/users/login", {
        email,
        password
      });

      if (response.status === 200 || response.status === httpStatus.OK) {
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("username", response.data.name);
        navigate("/");
      }
    } catch (err) {
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError("Login failed. Please try again.");
      }
      console.error(err);
    }
  }

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      // Clear previous messages
      setError("");
      setMessage("");

      const response = await axios.post("http://localhost:8000/api/v1/users/register", {
        name,
        email,
        password
      });

      if (response.status === 201) {
        setMessage("Registration Successful! Please Sign In.");
        setIsRightPanelActive(false); // Switch to login view
        setEmail("");
        setPassword("");
        setName("");
      }

    } catch (err) {
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError("Registration failed. Please try again.");
      }
      console.error(err);
    }
  }

  return (
    <div className="auth-body">
      <div className={`auth-container ${isRightPanelActive ? "right-panel-active" : ""}`} id="container">

        {/* Sign Up Form */}
        <div className="auth-form-container sign-up-container">
          <form className="auth-form" onSubmit={handleRegister}>
            <h1 className="auth-title">Create Account</h1>

            <input
              className="auth-input"
              type="text"
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <input
              className="auth-input"
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              className="auth-input"
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <button className="auth-button" type="submit">Sign Up</button>
            {error && <p style={{ color: 'red', fontSize: '0.8rem', marginTop: '10px' }}>{error}</p>}
          </form>
        </div>

        {/* Sign In Form */}
        <div className="auth-form-container sign-in-container">
          <form className="auth-form" onSubmit={handleLogin}>
            <h1 className="auth-title">Sign in</h1>

            <input
              className="auth-input"
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              className="auth-input"
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <a className="auth-link" href="#">Forgot your password?</a>
            <button className="auth-button" type="submit">Sign In</button>
            {error && <p style={{ color: 'red', fontSize: '0.8rem', marginTop: '10px' }}>{error}</p>}
            {message && <p style={{ color: 'green', fontSize: '0.8rem', marginTop: '10px' }}>{message}</p>}
          </form>
        </div>

        {/* Overlay */}
        <div className="overlay-container">
          <div className="overlay">
            <div className="overlay-panel overlay-left">
              <h1 className="auth-title">Welcome Back!</h1>
              <p className="auth-paragraph">To keep connected with us please login with your personal info</p>
              <button className="auth-ghost-button" onClick={handleSignInClick}>Sign In</button>
            </div>
            <div className="overlay-panel overlay-right">
              <h1 className="auth-title">Hello, Friend!</h1>
              <p className="auth-paragraph">Enter your personal details and start journey with us</p>
              <button className="auth-ghost-button" onClick={handleSignUpClick}>Sign Up</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}