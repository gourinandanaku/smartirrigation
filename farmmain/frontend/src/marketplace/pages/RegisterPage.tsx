import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { register } from '../services/auth';
import { useMarketplace } from '../state/useMarketplace';

const RegisterPage: React.FC = () => {
    const { login: contextLogin } = useMarketplace();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('buyer');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        try {
            const res = await register({ name, email, password, role });
            if (res.success) {
                // Update context state
                contextLogin(res.data);
                
                if (res.data.role === 'farmer') navigate('/marketplace/farmer');
                else navigate('/marketplace');
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Registration failed. Try again.');
        }
    };

    return (
        <div className="section" style={{ maxWidth: '400px', margin: 'auto', padding: '50px 20px' }}>
            <div className="form">
                <h1 style={{ textAlign: 'center' }}>Register</h1>
                <p className="muted" style={{ textAlign: 'center' }}>Step into the future of farming</p>

                {error && <div style={{ color: 'var(--error)', backgroundColor: '#ffeeee', padding: '10px', borderRadius: '4px', marginBottom: '15px' }}>{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="role-switcher__row" style={{ flexDirection: 'column', alignItems: 'flex-start', marginBottom: '15px' }}>
                        <label className="label">Full Name</label>
                        <input 
                            type="text" 
                            className="input" 
                            value={name} 
                            onChange={(e) => setName(e.target.value)} 
                            required 
                            placeholder="Enter your name"
                        />
                    </div>

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
                            placeholder="Create a password"
                        />
                    </div>

                    <div className="role-switcher__row" style={{ flexDirection: 'column', alignItems: 'flex-start', marginBottom: '15px' }}>
                        <label className="label">I am a</label>
                        <select 
                            className="input" 
                            value={role} 
                            onChange={(e) => setRole(e.target.value)}
                        >
                            <option value="buyer">Buyer</option>
                            <option value="farmer">Farmer</option>
                        </select>
                    </div>

                    <button type="submit" className="btn btn--primary" style={{ width: '100%', marginTop: '10px' }}>
                        Register Now
                    </button>
                </form>

                <p style={{ marginTop: '20px', textAlign: 'center' }} className="muted">
                    Already have an account? <Link to="/" style={{ color: 'var(--primary)' }}>Login Here</Link>
                </p>
                
                <div style={{ textAlign: 'center', marginTop: '10px' }}>
                   <Link to="/" className="muted" style={{ fontSize: '0.9rem' }}>← Back to Dashboard</Link>
                </div>
            </div>
        </div>
    );
};

export default RegisterPage;
