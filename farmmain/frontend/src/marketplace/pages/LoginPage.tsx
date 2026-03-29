import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { login } from '../services/auth';
import { useMarketplace } from '../state/useMarketplace';

const LoginPage: React.FC = () => {
    const { login: contextLogin } = useMarketplace();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        try {
            const res = await login({ email, password });
            if (res.success) {
                // Update context state
                contextLogin(res.data);
                
                // Redirect based on role
                const u = res.data;
                if (u.role === 'admin') navigate('/marketplace/admin');
                else if (u.role === 'farmer') navigate('/farmer');
                else navigate('/');
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Login failed. Please try again.');
        }
    };

    return (
        <div className="section" style={{ maxWidth: '400px', margin: 'auto', padding: '50px 20px' }}>
            <div className="form">
                <h1 style={{ textAlign: 'center' }}>Login</h1>
                <p className="muted" style={{ textAlign: 'center' }}>Welcome back to Smart Farm Marketplace</p>

                {error && <div style={{ color: 'var(--error)', backgroundColor: '#ffeeee', padding: '10px', borderRadius: '4px', marginBottom: '15px' }}>{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="role-switcher__row" style={{ flexDirection: 'column', alignItems: 'flex-start', marginBottom: '15px' }}>
                        <label className="label">Email Address</label>
                        <input 
                            type="email" 
                            className="input" 
                            value={email} 
                            onChange={(e) => setEmail(e.target.value)} 
                            required 
                            placeholder="Enter your email"
                        />
                    </div>

                    <div className="role-switcher__row" style={{ flexDirection: 'column', alignItems: 'flex-start', marginBottom: '15px' }}>
                        <label className="label">Password</label>
                        <input 
                            type="password" 
                            className="input" 
                            value={password} 
                            onChange={(e) => setPassword(e.target.value)} 
                            required 
                            placeholder="Enter your password"
                        />
                    </div>

                    <button type="submit" className="btn btn--primary" style={{ width: '100%', marginTop: '10px' }}>
                        Sign In
                    </button>
                </form>

                <p style={{ marginTop: '20px', textAlign: 'center' }} className="muted">
                    Don't have an account? <Link to="/register" style={{ color: 'var(--primary)' }}>Register Here</Link>
                </p>
                
                <div style={{ textAlign: 'center', marginTop: '10px' }}>
                   <Link to="/" className="muted" style={{ fontSize: '0.9rem' }}>← Back to Dashboard</Link>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
