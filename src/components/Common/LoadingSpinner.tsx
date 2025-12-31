interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
}

const LoadingSpinner = ({ size = 'md', text }: LoadingSpinnerProps) => {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  };

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-12">
      <div className="relative">
        <div
          className={`${sizeClasses[size]} border-4 border-gray-200 rounded-full`}
        ></div>
        <div
          className={`${sizeClasses[size]} border-4 border-[#172030] border-t-transparent rounded-full animate-spin absolute top-0 left-0`}
        ></div>
      </div>
      {text && (
        <p className="text-gray-600 font-medium">{text}</p>
      )}
    </div>
  );
};

export default LoadingSpinner;

