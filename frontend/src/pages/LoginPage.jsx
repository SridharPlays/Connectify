import { useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import AuthImagePattern from "../components/AuthImagePattern";
import { Link } from "react-router-dom";
import { Eye, EyeOff, Loader2, Lock, MessageSquare, User, AlertTriangle } from "lucide-react";

const LoginPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    loginId: "",
    password: "",
  });
  
  // Reset Modal State
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmail, setResetEmail] = useState("");

  const { login, isLoggingIn, sendPasswordReset } = useAuthStore();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await login(formData);
    
    // Check if the login failed due to too many attempts
    if (!result.success && result.error?.showReset) {
        setResetEmail(result.error.email || ""); // Backend sends email if we need it
        setShowResetModal(true);
    }
  };

  const handleResetConfirm = async () => {
    if (resetEmail || formData.loginId) {
        // Use the email from backend response, or fall back to input if it looks like an email
        const emailToSend = resetEmail || (formData.loginId.includes("@") ? formData.loginId : null);
        if(emailToSend) {
            await sendPasswordReset(emailToSend);
        }
    }
    setShowResetModal(false);
  };

  return (
    <div className="h-screen grid lg:grid-cols-2 relative">
      {/* Left Side - Form */}
      <div className="flex flex-col justify-center items-center p-6 sm:p-12">
        <div className="w-full max-w-md space-y-8">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="flex flex-col items-center gap-2 group">
              <div
                className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20
              transition-colors"
              >
                <MessageSquare className="w-6 h-6 text-primary" />
              </div>
              <h1 className="text-2xl font-bold mt-2">Welcome Back</h1>
              <p className="text-base-content/60">Sign in to your account</p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Username or Email</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-base-content/40" />
                </div>
                <input
                  type="text"
                  className={`input input-bordered w-full pl-10`}
                  placeholder="girlypop or girlypop@gmail.com"
                  value={formData.loginId}
                  onChange={(e) => setFormData({ ...formData, loginId: e.target.value })}
                />
              </div>
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Password</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-base-content/40" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  className={`input input-bordered w-full pl-10`}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-base-content/40" />
                  ) : (
                    <Eye className="h-5 w-5 text-base-content/40" />
                  )}
                </button>
              </div>
            </div>

            <button type="submit" className="btn btn-primary w-full" disabled={isLoggingIn}>
              {isLoggingIn ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Loading...
                </>
              ) : (
                "Sign in"
              )}
            </button>
          </form>

          <div className="text-center">
            <p className="text-base-content/60">
              Don&apos;t have an account?{" "}
              <Link to="/signup" className="link link-primary">
                Create account
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Image/Pattern */}
      <AuthImagePattern
        title={"Welcome back!"}
        subtitle={"Sign in to continue your conversations and catch up with your messages."}
      />

      {/* Reset Password Modal */}
      {showResetModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-base-100 p-6 rounded-xl shadow-2xl max-w-sm w-full text-center space-y-4">
            <div className="flex justify-center text-warning">
              <AlertTriangle className="w-12 h-12" />
            </div>
            <h3 className="text-lg font-bold">Trouble Logging In?</h3>
            <p className="text-base-content/70">
              We noticed multiple failed attempts. Would you like to reset your password?
            </p>
            <div className="flex gap-3 justify-center mt-4">
              <button 
                className="btn btn-ghost" 
                onClick={() => setShowResetModal(false)}
              >
                Cancel
              </button>
              <button 
                className="btn btn-primary" 
                onClick={handleResetConfirm}
              >
                Yes, Reset Password
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default LoginPage;