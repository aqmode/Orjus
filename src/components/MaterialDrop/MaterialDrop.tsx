import React, { useEffect } from 'react';
import { Icon } from '../Icon';
import './MaterialDrop.css';

interface MaterialDropProps {
  materialName: string;
  materialEmoji: string;
  iconName: string;
  x: number;
  y: number;
  onComplete: () => void;
}

export const MaterialDrop: React.FC<MaterialDropProps> = ({
  materialName,
  materialEmoji,
  iconName,
  x,
  y,
  onComplete,
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, 2000); // Animation duration

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div 
      className="material-drop"
      style={{
        left: x,
        top: y,
      }}
    >
      <Icon 
        name={iconName} 
        emoji={materialEmoji} 
        size={48}
        className="material-drop__icon"
        alt={materialName}
      />
      <div className="material-drop__label">{materialName}</div>
    </div>
  );
};

export default MaterialDrop;
