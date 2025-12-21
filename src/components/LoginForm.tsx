// LoginForm Component - The right side with email/password inputs
// Now connected to the backend API with both login and register functionality!
import React, { useState } from 'react';
import { login, register, getCurrentUser } from '../services/auth/authService';

function LoginForm({ onLogin }) {
  // State to toggle between login and register modes
  // isRegisterMode = false means login mode, true means register mode
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  
  // State to store form data
  // useState is a React Hook that lets us add state to our component
  const [fullName, setFullName] = useState(''); // Only used in register mode
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [keepSignedIn, setKeepSignedIn] = useState(false);
  
  // State for loading and error handling
  const [isLoading, setIsLoading] = useState(false); // Shows loading spinner
  const [error, setError] = useState(''); // Stores error message to display
  const [successMessage, setSuccessMessage] = useState(''); // Stores success message

  // Function that runs when user submits the form
  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevents page from refreshing
    
    // Clear any previous errors and success messages
    setError('');
    setSuccessMessage('');
    
    // Show loading state
    setIsLoading(true);
    
    try {
      if (isRegisterMode) {
        // Handle registration
        const result = await register(fullName, email, password);
        
        if (result.success) {
          // Registration successful!
          console.log('Registration successful!', result.user);
          setSuccessMessage('Account created successfully! Please login with your credentials.');
          
          // Clear form and switch to login mode after a short delay
          setTimeout(() => {
            setFullName('');
            setEmail('');
            setPassword('');
            setIsRegisterMode(false);
            setSuccessMessage('');
          }, 2000);
        } else {
          // Registration failed - show error message
          setError(result.error || 'Registration failed. Please try again.');
        }
      } else {
        // Handle login
        const result = await login(email, password);
        
        if (result.success) {
          // Login successful! Token is already saved in localStorage
          console.log('Login successful!');
          
          // Immediately fetch user profile after successful login
          const userResult = await getCurrentUser();
          
          if (userResult.success && userResult.user) {
            // Pass user data along with login callback
            onLogin(userResult.user);
          } else {
            // Even if profile fetch fails, still proceed with login
            console.warn('Failed to fetch user profile:', userResult.error);
            onLogin(null);
          }
        } else {
          // Login failed - show error message
          setError(result.error || 'Login failed. Please try again.');
        }
      }
    } catch (err) {
      // Handle unexpected errors
      console.error('Auth error:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      // Always stop loading, whether success or failure
      setIsLoading(false);
    }
  };

  // Function to toggle between login and register modes
  const toggleMode = () => {
    setIsRegisterMode(!isRegisterMode);
    setError('');
    setSuccessMessage('');
    // Clear form when switching modes
    setFullName('');
    setEmail('');
    setPassword('');
  };

  return (
    <div className="bg-[#1a2332] p-12 md:w-1/2 flex flex-col justify-center">
      
      {/* Welcome heading */}
      <div className="mb-8">
        <h2 className="text-white text-2xl mb-2">
          {isRegisterMode ? 'Create Your Account' : "Hello, I'm your Vision Copilot."}
        </h2>
        <p className="text-gray-400 text-sm">
          {isRegisterMode 
            ? 'Join us and start your journey with Vision Copilot.' 
            : "Let's get you inside your workspace."}
        </p>
      </div>

      {/* Success message display */}
      {successMessage && (
        <div className="mb-4 p-3 bg-green-500/20 border border-green-500 rounded-lg">
          <p className="text-green-400 text-sm">{successMessage}</p>
        </div>
      )}

      {/* Error message display */}
      {error && (
        <div className="mb-4 p-3 bg-red-500/20 border border-red-500 rounded-lg">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Login/Register form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Full Name input field - Only shown in register mode */}
        {isRegisterMode && (
          <div>
            <label className="text-white text-sm block mb-2">
              Full Name
            </label>
            <input
              type="text"
              placeholder="John Doe"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full bg-[#0f1729] border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
              required
              disabled={isLoading}
            />
          </div>
        )}
        
        {/* Email input field */}
        <div>
          <label className="text-white text-sm block mb-2">
            Email
          </label>
          <input
            type="email"
            placeholder="you@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)} // Updates email state when user types
            className="w-full bg-[#0f1729] border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
            required // Makes this field mandatory
            disabled={isLoading} // Disable input while loading
          />
        </div>

        {/* Password input field */}
        <div>
          <label className="text-white text-sm block mb-2">
            Password
          </label>
          <input
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)} // Updates password state when user types
            className="w-full bg-[#0f1729] border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
            required // Makes this field mandatory
            disabled={isLoading} // Disable input while loading
          />
        </div>

        {/* Keep me signed in checkbox and Reset password link - Only shown in login mode */}
        {!isRegisterMode && (
          <div className="flex items-center justify-between">
            
            {/* Checkbox */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={keepSignedIn}
                onChange={(e) => setKeepSignedIn(e.target.checked)} // Updates checkbox state
                className="w-4 h-4 bg-[#0f1729] border border-gray-700 rounded cursor-pointer"
                disabled={isLoading} // Disable checkbox while loading
              />
              <span className="text-gray-400 text-sm">Keep me signed in</span>
            </label>

            {/* Reset password link */}
            <button
              type="button"
              onClick={() => alert('Password reset functionality coming soon!')}
              className="text-blue-400 text-sm hover:text-blue-300 transition-colors"
              disabled={isLoading} // Disable link while loading
            >
              Reset password
            </button>
          </div>
        )}

        {/* Continue/Submit button */}
        <button
          type="submit"
          disabled={isLoading} // Disable button while loading
          className="w-full bg-[#3366ff] hover:bg-[#2952cc] disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              {/* Loading spinner */}
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>{isRegisterMode ? 'Creating account...' : 'Logging in...'}</span>
            </>
          ) : (
            isRegisterMode ? 'Create Account' : 'Continue'
          )}
        </button>
      </form>

      {/* Toggle between login and register modes */}
      <div className="mt-8 text-center">
        <p className="text-gray-400 text-sm">
          {isRegisterMode ? (
            <>
              Already have an account?{' '}
              <button
                type="button"
                onClick={toggleMode}
                className="text-blue-400 hover:text-blue-300 transition-colors"
                disabled={isLoading}
              >
                Sign in
              </button>
            </>
          ) : (
            <>
              New to AI ORA?{' '}
              <button
                type="button"
                onClick={toggleMode}
                className="text-blue-400 hover:text-blue-300 transition-colors"
                disabled={isLoading}
              >
                Get started
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}

export default LoginForm;