
import React, { useEffect, useState } from 'react';
import EnhancedLoadingButton from '@/components/common/EnhancedLoadingButton';

interface EnhancedSaveButtonProps {
  onClick: () => void;
  isLoading?: boolean;
  isAdding?: boolean;
  className?: string;
}

const EnhancedSaveButton: React.FC<EnhancedSaveButtonProps> = ({
  onClick,
  isLoading = false,
  isAdding = false,
  className
}) => {
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);

  // Reset success/error states when loading starts
  useEffect(() => {
    if (isLoading) {
      setShowSuccess(false);
      setShowError(false);
    }
  }, [isLoading]);

  const handleClick = async () => {
    try {
      onClick();
      // Show success briefly after save
      setTimeout(() => setShowSuccess(true), 100);
      setTimeout(() => setShowSuccess(false), 2000);
    } catch (error) {
      setShowError(true);
      setTimeout(() => setShowError(false), 3000);
    }
  };

  return (
    <EnhancedLoadingButton
      onClick={handleClick}
      isLoading={isLoading}
      loadingText={isAdding ? "Adding Room..." : "Saving Changes..."}
      success={showSuccess}
      error={showError}
      className={className}
    >
      {isAdding ? "Add Room" : "Save Changes"}
    </EnhancedLoadingButton>
  );
};

export default EnhancedSaveButton;
