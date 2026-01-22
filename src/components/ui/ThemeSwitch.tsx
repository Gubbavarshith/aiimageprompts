import React from 'react';
import styled from 'styled-components';

interface ThemeSwitchProps {
  checked: boolean;
  onChange: () => void;
}

const Switch: React.FC<ThemeSwitchProps> = ({ checked, onChange }) => {
  return (
    <StyledWrapper>
      <label className="switch">
        <input 
          checked={checked}
          onChange={onChange}
          id="theme-checkbox" 
          type="checkbox" 
        />
        <span className="slider">
          <div className="star star_1" />
          <div className="star star_2" />
          <div className="star star_3" />
          <svg viewBox="0 0 16 16" className="cloud_1 cloud">
            <path transform="matrix(.77976 0 0 .78395-299.99-418.63)" fill="#fff" d="m391.84 540.91c-.421-.329-.949-.524-1.523-.524-1.351 0-2.451 1.084-2.485 2.435-1.395.526-2.388 1.88-2.388 3.466 0 1.874 1.385 3.423 3.182 3.667v.034h12.73v-.006c1.775-.104 3.182-1.584 3.182-3.395 0-1.747-1.309-3.186-2.994-3.379.007-.106.011-.214.011-.322 0-2.707-2.271-4.901-5.072-4.901-2.073 0-3.856 1.202-4.643 2.925" />
          </svg>
        </span>
      </label>
    </StyledWrapper>
  );
}

const StyledWrapper = styled.div`
  /* Theme Switch */
  /* The switch - the box around the slider */
  .switch {
    font-size: 15px;
    position: relative;
    display: inline-block;
    width: 3.2em;
    height: 1.6em;
    border-radius: 22px;
    box-shadow: 0 0 8px rgba(0, 0, 0, 0.08);
  }

  /* Hide default HTML checkbox */
  .switch input {
    opacity: 0;
    width: 0;
    height: 0;
  }

  /* The slider */
  .slider {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: #2a2a2a;
    transition: 0.4s;
    border-radius: 22px;
    overflow: hidden;
  }

  .slider:before {
    position: absolute;
    content: "";
    height: 1.1em;
    width: 1.1em;
    border-radius: 50%;
    left: 0.25em;
    bottom: 0.25em;
    transition: 0.4s;
    transition-timing-function: cubic-bezier(0.81, -0.04, 0.38, 1.5);
    box-shadow: inset 7px -3px 0px 0px #fff;
  }

  .switch input:checked + .slider {
    background-color: #00a6ff;
  }

  .switch input:checked + .slider:before {
    transform: translateX(1.6em);
    box-shadow: inset 13px -3px 0px 13px #ffcf48;
  }

  .star {
    background-color: #fff;
    border-radius: 50%;
    position: absolute;
    width: 3.5px;
    transition: all 0.4s;
    height: 3.5px;
  }

  .star_1 {
    left: 2em;
    top: 0.35em;
  }

  .star_2 {
    left: 1.75em;
    top: 0.8em;
  }

  .star_3 {
    left: 2.35em;
    top: 0.6em;
  }

  .switch input:checked ~ .slider .star {
    opacity: 0;
  }

  .cloud {
    width: 2.8em;
    position: absolute;
    bottom: -1.1em;
    left: -0.9em;
    opacity: 0;
    transition: all 0.4s;
  }

  .switch input:checked ~ .slider .cloud {
    opacity: 1;
  }
`;

export default Switch;

