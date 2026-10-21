import { forwardRef } from 'react';

const EmptyState = forwardRef(({ 
  icon, 
  title, 
  description, 
  action, 
  className = '',
  ...props 
}, ref) => {
  return (
    <div ref={ref} className={`empty-state ${className}`} {...props}>
      {icon && <div className="empty-state-icon">{icon}</div>}
      {title && <h3 className="empty-state-title">{title}</h3>}
      {description && <p className="empty-state-description">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
});

EmptyState.displayName = 'EmptyState';
export default EmptyState;