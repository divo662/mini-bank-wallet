import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface SuccessModalProps {
  isOpen: boolean;
  message: string;
  onClose: () => void;
  redirectTo?: string;
  redirectDelay?: number;
}

const SuccessModal = ({ 
  isOpen, 
  message, 
  onClose: _onClose, 
  redirectTo = '/',
  redirectDelay = 2000 
}: SuccessModalProps) => {
  const navigate = useNavigate();
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!isOpen) {
      setProgress(0);
      return;
    }

    // Reset progress when modal opens
    setProgress(0);

    // Animate progress bar
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + (100 / (redirectDelay / 50)); // Update every 50ms
      });
    }, 50);

    // Auto-redirect after delay
    const timeout = setTimeout(() => {
      if (redirectTo) {
        navigate(redirectTo);
      }
    }, redirectDelay);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [isOpen, redirectTo, redirectDelay, navigate]);

  const handleManualRedirect = () => {
    if (redirectTo) {
      navigate(redirectTo);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-4 sm:p-6 text-center">
        <div className="mb-4">
          <div className="w-14 h-14 sm:w-16 sm:h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
            <svg className="w-7 h-7 sm:w-8 sm:h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1 sm:mb-2">Success!</h2>
          <p className="text-sm sm:text-base text-gray-600 mb-4">{message}</p>
          
          {/* Progress Bar */}
          <div className="mb-4">
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div
                className="bg-green-600 h-2 rounded-full transition-all duration-50 ease-linear"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Redirecting in {Math.ceil((redirectDelay - (progress / 100) * redirectDelay) / 1000)}s...
            </p>
          </div>
        </div>

        {/* Manual Redirect Button */}
        <button
          onClick={handleManualRedirect}
          className="w-full bg-[#172030] hover:opacity-90 active:opacity-80 text-white py-2.5 sm:py-3 px-4 rounded-lg font-medium transition-opacity text-sm sm:text-base"
        >
          Go to Dashboard
        </button>
      </div>
    </div>
  );
};

export default SuccessModal;
