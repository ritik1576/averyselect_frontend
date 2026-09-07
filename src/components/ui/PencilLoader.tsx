import React from 'react';
import './PencilLoader.css';

export const PencilLoader: React.FC = () => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      height="200px"
      width="200px"
      viewBox="0 0 200 200"
      className="pencil"
    >
      <defs>
        <clipPath id="pencil-eraser">
          <rect height="30" width="30" ry="5" rx="5"></rect>
        </clipPath>
      </defs>
      <circle
        transform="rotate(-113,100,100)"
        strokeLinecap="round"
        strokeDashoffset="439.82"
        strokeDasharray="439.82 439.82"
        strokeWidth="2"
        stroke="var(--color-neutral-900)" /* Black in light mode, white in dark mode */
        fill="none"
        r="70"
        className="pencil__stroke"
      ></circle>
      <g transform="translate(100,100)" className="pencil__rotate">
        <g fill="none">
          <circle
            transform="rotate(-90)"
            strokeDashoffset="402"
            strokeDasharray="402.12 402.12"
            strokeWidth="30"
            stroke="var(--color-primary)"
            r="64"
            className="pencil__body1"
          ></circle>
          <circle
            transform="rotate(-90)"
            strokeDashoffset="465"
            strokeDasharray="464.96 464.96"
            strokeWidth="10"
            stroke="#f26b4d" /* Lighter */
            r="74"
            className="pencil__body2"
          ></circle>
          <circle
            transform="rotate(-90)"
            strokeDashoffset="339"
            strokeDasharray="339.29 339.29"
            strokeWidth="10"
            stroke="#c33517" /* Darker */
            r="54"
            className="pencil__body3"
          ></circle>
        </g>
        <g transform="rotate(-90) translate(49,0)" className="pencil__eraser">
          <g className="pencil__eraser-skew">
            <rect height="30" width="30" ry="5" rx="5" fill="var(--color-border-strong)"></rect>
            <rect clipPath="url(#pencil-eraser)" height="30" width="5" fill="var(--color-neutral-400)"></rect>
            <rect height="20" width="30" fill="var(--color-neutral-200)"></rect>
            <rect height="20" width="15" fill="var(--color-neutral-300)"></rect>
            <rect height="20" width="5" fill="var(--color-neutral-400)"></rect>
            <rect height="2" width="30" y="6" fill="var(--color-border)"></rect>
            <rect height="2" width="30" y="13" fill="var(--color-border)"></rect>
          </g>
        </g>
        <g transform="rotate(-90) translate(49,-30)" className="pencil__point">
          <polygon points="15 0,30 30,0 30" fill="#f3b775"></polygon>
          <polygon points="15 0,6 30,0 30" fill="#e68a19"></polygon>
          <polygon points="15 0,20 10,10 10" fill="var(--color-neutral-900)"></polygon>
        </g>
      </g>
    </svg>
  );
};
