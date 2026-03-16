# **App Name**: Nexus FleetCommand

## Core Features:

- User & Role Management: Securely manage Super Admin, Admin, and Driver accounts with Firebase Authentication, enabling role-based access control and configurable system branding.
- Command Center Dashboard: An interactive dashboard featuring draggable widgets such as Fleet Status, Live Vehicle Map, Driver Analytics, and Maintenance Alerts, allowing users to customize their layout.
- Real-time Vehicle Tracking: Monitor vehicle locations, status, speed, and animated routes in real-time on a Leaflet map with OpenStreetMap tiles, utilizing Firestore listeners for instant updates and vehicle history playback.
- Fleet & Trip Management: Manage vehicle profiles, assign drivers, track maintenance schedules and document expiries, review trip logs, and approve fuel expenses, with all data stored in Firestore.
- Geofencing & Alerts: Admins can define and manage geographic zones (Warehouse, Delivery Area, Restricted Zone) using polygon drawing tools, triggering real-time alerts when vehicles enter or exit specific areas, stored and managed via Firestore.
- Performance Analytics Dashboard: Visualize key operational data including Driver Safety Scores, Fuel Consumption Trends, Trip Completion Statistics, and Vehicle Utilization Rates using Recharts for comprehensive fleet insights.
- Mobile Driver Application: A responsive interface optimized for mobile and tablet devices, allowing drivers to start/end trips, view assigned routes, upload fuel receipts, log expenses, and receive performance feedback.

## Style Guidelines:

- Primary interactive color: A deep, professional navy blue (#192A4D) that evokes a sense of reliability and advanced technology, suited for control elements and primary highlights.
- Background color: A very dark, almost black charcoal with a subtle hint of blue (#131518) to create an immersive 'command center' environment, ensuring high contrast for UI elements.
- Accent color: A vibrant industrial orange (#FF8000) strategically used for critical actions, alerts, and to provide strong visual contrast against the dark background. This color also signifies 'Maintenance' status.
- Status colors: 'Active' vehicles will be indicated by a clear, bright green (#00CC00). 'Idle' will use a sharp yellow (#FFFF00). 'Emergency' situations will be highlighted with a vivid red (#FF0000).
- For all text, the 'Inter' sans-serif font is recommended for its modern, highly legible, and objective appearance, crucial for readability in high-density data tables and a control center interface.
- Line-based icons with subtle glowing effects are recommended to align with the 'glowing data indicators' aesthetic, maintaining a minimalist yet futuristic look.
- The main dashboard will feature a grid layout with draggable and resizable widgets, designed for high-density data presentation reminiscent of a futuristic command console. The driver interface will prioritize mobile-first, clean layouts for on-the-go usability.
- Smooth UI transitions including page fade-ins, widget entrance animations, and subtle counter effects for statistics. Map elements will feature animated vehicle movement along routes, route drawing, and geofence glow effects.
- Interactive animations will include draggable widgets with fluid motion, alert pop-ups with gentle shake effects, and highlight animations for maintenance warnings. Loading states will incorporate Lottie animations for a polished user experience.