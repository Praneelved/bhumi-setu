import React, { useState, useEffect } from 'react';
import { Search, ShieldCheck, UserCircle, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { clearAuthSession } from '../../services/api';
import { getLoginForRole } from '../auth/authRouteUtils';

const Header = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const checkUser = () => {
      const stored = localStorage.getItem('bhoomi_user');
      if (stored) {
        try {
          setCurrentUser(JSON.parse(stored));
        } catch {
          setCurrentUser(null);
        }
      } else {
        setCurrentUser(null);
      }
    };
    checkUser();
    window.addEventListener('storage', checkUser);
    return () => window.removeEventListener('storage', checkUser);
  }, []);

  const handleLogout = () => {
    const loginPage = currentUser ? getLoginForRole(currentUser.user_type) : '/login';
    clearAuthSession(); // clears bhoomi_token + bhoomi_user + fires storage event
    setCurrentUser(null);
    navigate(loginPage, { replace: true });
  };

  return (
    <header style={{ 
      backgroundColor: 'var(--surface-container-lowest)', 
      borderBottom: '1px solid var(--outline-variant)',
      padding: 'var(--space-sm) var(--space-xl)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      height: '80px'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
        <img 
          src="https://upload.wikimedia.org/wikipedia/commons/5/55/Emblem_of_India.svg" 
          alt="Emblem of India" 
          style={{ height: '48px' }} 
        />
        <div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--space-xs)' }}>
            <h1 className="headline-lg" style={{ color: 'var(--primary)', margin: 0 }}>BhoomiSetu</h1>
            <span className="headline-md" style={{ color: 'var(--primary)', margin: 0 }}>(भूमि सेतु)</span>
          </div>
          <p className="label-sm" style={{ color: 'var(--on-surface-variant)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            National Land Acquisition & Management System (NLAMS)
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-lg)' }}>
        <div style={{ 
          position: 'relative', 
          width: '360px' 
        }}>
          <Search size={16} color="var(--outline)" style={{ position: 'absolute', left: '12px', top: '12px' }} />
          <input 
            type="text" 
            placeholder="Search by Khasra, Survey No, Project Code, or Gazette Ref..." 
            style={{
              width: '100%',
              padding: '10px 12px 10px 36px',
              backgroundColor: 'var(--surface-container)',
              border: '1px solid transparent',
              borderRadius: 'var(--radius-xl)',
              fontFamily: 'var(--font-body)',
              fontSize: '13px',
              outline: 'none'
            }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 'var(--space-sm)',
            backgroundColor: 'var(--surface-container-low)',
            padding: 'var(--space-xs) var(--space-md)',
            borderRadius: 'var(--radius)'
          }}>
            <ShieldCheck size={20} color="var(--secondary)" />
            <div>
              <p className="label-sm" style={{ margin: 0, color: 'var(--primary)', fontWeight: 600 }}>
                {currentUser ? currentUser.name : 'Official Portal'}
              </p>
              <p className="label-sm" style={{ margin: 0, color: 'var(--on-surface-variant)', fontSize: '10px' }}>
                {currentUser ? currentUser.designation : 'CALA / SLAO / AGENCY'}
              </p>
            </div>
          </div>
          
          {currentUser ? (
            <button 
              onClick={handleLogout}
              title="Sign Out"
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', color: 'var(--outline)' }}>
              <LogOut size={20} />
            </button>
          ) : (
            <UserCircle size={32} color="var(--primary-container)" />
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
