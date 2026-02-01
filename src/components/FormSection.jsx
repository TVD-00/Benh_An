import React from 'react';

const FormSection = ({ title, children, className }) => {
    return (
        <div className={`card ${className || ''}`}>
            <h3>{title}</h3>
            <div className="section-content">
                {children}
            </div>
        </div>
    );
};

export default FormSection;
