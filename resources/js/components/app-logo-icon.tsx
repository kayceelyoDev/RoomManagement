import type { SVGAttributes } from 'react';

export default function WindowIcon(props: SVGAttributes<SVGElement>) {
    return (
        <svg {...props} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="currentColor">
            {/* Outer Frame */}
            <path fillRule="evenodd" clipRule="evenodd" d="M3 3C2.44772 3 2 3.44772 2 4V20C2 20.5523 2.44772 21 3 21H21C21.5523 21 22 20.5523 22 20V4C22 3.44772 21.5523 3 21 3H3ZM4 11H11V5H4V11ZM13 5V11H20V5H13ZM11 13H4V19H11V13ZM13 13V19H20V13H13Z" />
            {/* "Active" Room Pane - represents the management aspect */}
            <rect x="13" y="13" width="7" height="6" />
        </svg>
    );
}