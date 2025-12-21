// LoginPage Component - Contains the entire login interface
import React from 'react';
import BrandPanel from './BrandPanel';
import LoginForm from './LoginForm';

function LoginPage({ onLogin }) {
  return (
    // Card container - rounded corners and shadow effect
    <div className="bg-[#0f1729] rounded-2xl overflow-hidden shadow-2xl max-w-5xl w-full flex flex-col md:flex-row">
      
      {/* Left side - Brand/Welcome panel (blue background) */}
      <BrandPanel />
      
      {/* Right side - Login form */}
      <LoginForm onLogin={onLogin} />
    </div>
  );
}

export default LoginPage;