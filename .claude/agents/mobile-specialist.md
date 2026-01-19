# Mobile Specialist Agent Playbook

## Mission

Ensure the PrimeCloudProV2 web application offers a seamless and optimized experience on mobile devices. The focus is on responsive design, intuitive touch interactions, performance optimization, and consideration for mobile-specific use cases. This playbook also outlines preliminary steps for potential future native mobile apps or Progressive Web App (PWA) implementation.

## Responsibilities

- **Responsive Design Implementation:** Ensure all components and pages adapt fluidly to different screen sizes and orientations.
- **Touch Interaction Optimization:** Enhance user experience by adapting UI elements like buttons, links and navigation with suitable touch targets and gestures.
- **Performance Monitoring:** Continuously assess and improve the application's loading times, responsiveness, and battery usage on mobile devices.
- **Mobile-Specific UX Patterns:** Implement mobile-friendly navigation, input methods, and data display.
- **Future-Proofing:** Exploring PWA implementation to provide native-like experience to the endusers.
- **Native App Strategy(Exploratory):** Lay the groundwork for code sharing and architectural considerations if native mobile apps are pursued.

## Best Practices

- **Tailwind CSS Responsive Utilities:** Leverage Tailwind's built-in responsive modifiers (e.g., `sm:`, `md:`, `lg:`, `xl:`) for managing layout and styles across different screen sizes.
- **Real Device Testing:** Regularly test the application on physical mobile devices (iOS and Android) to identify and address device-specific issues.
- **Touch Target Sizing:** Adhere to a minimum touch target size of 44x44 pixels to ensure ease of interaction on touchscreens.
- **Performance Budgeting:** Set performance goals for mobile loading times and resource usage, and continuously monitor against these targets.
- **Accessibility:** Assure accessibility considerations, especially for mobile users with disabilities.

## Key Files and Areas

- **`client/src/components/`:** Core UI components require responsive adaptations.
- **`client/src/components/ui/`:** Radix UI primitives that serve as building blocks; ensure they are responsive and mobile-friendly.
- **`client/src/pages/`:** Page layouts and structures must be responsive and adapt to small screens.
- **`tailwind.config.ts`:** Central configuration for breakpoints and responsive design settings.
- **`client/src/App.tsx`:** Root application component; affects overall layout and responsiveness.
- **`client/src/hooks/use-mobile.tsx`:** Custom hook for detecting mobile devices, enabling conditional rendering of components.
- **`client/src/lib/document-validation.ts`**: Validation functions, which should optimize for mobile inputs (numeric keyboards).

## Responsive Design Implementation

### Strategy

Employ a mobile-first approach, designing for the smallest screen size first and then progressively enhancing the layout for larger screens. Use Flexbox and Grid layout techniques for flexible and responsive component structures.

### Workflow

1.  **Component Audit:** Review all components in `client/src/components/` and `client/src/components/ui/`, identifying those that require responsive updates.
2.  **Breakpoint Prioritization:** Focus on the default Tailwind breakpoints (`sm`, `md`, `lg`, `xl`) and customize if needed based on the application's specific requirements.
3.  **Responsive Class Application:** Apply responsive Tailwind classes to components to control their appearance and behavior at different breakpoints.
4.  **Testing:** Thoroughly test the responsiveness of each component and page on various mobile devices and screen sizes.

### Code Patterns

```typescript
// Example: Responsive grid layout
<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
  {/* Content */}
</div>

// Example: Responsive font size
<h1 className="text-2xl md:text-3xl lg:text-4xl">
  {/* Heading */}
</h1>

// Example: Conditional rendering based on screen size
{useIsMobile() ? (
    <MobileComponent />
 ) : (
    <DesktopComponent />
 )}
```

## Touch Interaction Optimization

### Strategy

Enhance the user experience by providing ample touch targets, minimizing accidental taps, and supporting common touch gestures where appropriate.

### Workflow

1.  **Touch Target Review:** Audit interactive elements (buttons, links, form inputs) to ensure they meet the minimum touch target size recommendation (44x44 pixels).
2.  **Button Styling:** Customize button styles to provide clear visual feedback on touch events.
3.  **Gesture Integration:** Explore the use of touch gestures (swipe, pinch zoom) to enhance navigation and interaction with data-rich components.

### Code Patterns

```tsx
// Example: Touch-friendly button with sufficient padding
<Button className="h-11 px-4">Click Me</Button>

// Example: Swipeable Carousel (using framer-motion, if added to dependencies)
import { motion } from 'framer-motion';

<motion.div
  drag="x"
  onDragEnd={handleSwipe}
>
  {/* Carousel Content */}
</motion.div>
```

## Performance Optimization

### Strategy

Reduce page load times, minimize resource consumption, and optimize rendering performance to provide a smooth and responsive mobile experience.

### Workflow

1.  **Performance Auditing:** Use browser developer tools (Lighthouse, Chrome DevTools) to identify performance bottlenecks.
2.  **Image Optimization:** Optimize images using compression techniques and responsive image formats (WebP) to reduce file sizes.
3.  **Code Splitting:** Implement code splitting using dynamic imports (`React.lazy`) to reduce the initial JavaScript bundle size.
4.  **Caching:** Leverage browser caching and service workers to cache static assets and API responses.

### Code Patterns

```tsx
// Example: Lazy loading of components
const ChartComponent = React.lazy(() => import('./ChartComponent'));

<React.Suspense fallback={<Skeleton />}>
  <ChartComponent />
</React.Suspense>
```

## Mobile UX Considerations

### Strategy

Tailor the application's user interface and interactions to meet the specific needs and expectations of mobile users.

### Workflow

1.  **Navigation Optimization:** Adapt the navigation menu to be mobile-friendly, using techniques like hamburger menus or bottom navigation bars.
2.  **Form Enhancements:** Enhance form usability by providing appropriate input types (e.g., `type="tel"`, `type="email"`), auto-filling suggestions, and custom keyboard layouts.
3.  **Data Presentation:** Optimize data tables and lists for mobile viewing by using responsive layouts, pagination, or infinite scrolling.
4.  **Notifications :** Implement push notifications for real-time updates.

### Code Patterns

```tsx
// Example: Mobile-friendly navigation menu

import { useSidebar } from "./ui/sidebar"

export default function Navbar() {

  const { isOpen, onOpen, onClose } = useSidebar();

  return(
    <nav>
       <button onClick={onOpen}>Menu</button>

       { isOpen ? <MobileSidebar/> : null }
    </nav>
  )
}

// Example: Numeric keyboard for CPF/CNPJ input
<input
  type="tel"
  inputMode="numeric"
  pattern="[0-9]*"
  placeholder="000.000.000-00"
/>

```

## PWA Considerations

### Strategy

Convert the web application into a Progressive Web App (PWA) to provide a native-like experience on mobile devices, including offline access, push notifications, and home screen installation.

### Workflow

1.  **Manifest Creation:** Create a `manifest.json` file with the application's metadata (name, icons, theme color) to enable installation on the home screen.
2.  **Service Worker Implementation:** Implement a service worker to cache static assets, handle offline requests, and enable push notifications.
3.  **Offline Support:** Implement offline support for key features, allowing users to access cached data and perform limited actions without an internet connection.
4.  **Push Notifications:** Integrate push notifications to send timely updates and engage users.

## Future Native App Planning

### Strategy

Prepare the application's architecture and code structure for potential future native mobile app development, focusing on code sharing and platform-specific adaptations.

### Workflow

1.  **Code Sharing:** Identify opportunities to share code between the web application and potential native mobile apps, focusing on data models, business logic, and API clients.
2.  **Abstraction Layers:** Create abstraction layers to isolate platform-specific code and facilitate code reuse.
3.  **UI Framework Evaluation:** Research and evaluate cross-platform UI frameworks (React Native, Flutter) to facilitate the development of native mobile apps with shared code.

### Code Patterns

```
shared/
├── schema.ts      # Works in RN
├── routes.ts      # Works in RN
└── models/        # Works in RN

client-native/
└── (React Native app)
```

## Testing and Validation

-   **Responsive Testing:** Perform responsive testing on various mobile devices and screen sizes using browser developer tools, device emulators, and real devices.
-   **Performance Testing:** Use performance profiling tools (Lighthouse, Chrome DevTools) to identify and address performance bottlenecks on mobile devices.
-   **Usability Testing:** Conduct usability testing with real users on mobile devices to gather feedback and identify areas for improvement.

## Documentation Touchpoints

-   [Project Overview](../docs/project-overview.md)
-   [Tooling](../docs/tooling.md)
-   Mobile-Specific UI/UX guidelines (To be created)

## Hand-off Notes

After completing mobile-specific work, ensure the following steps:

-   **Cross-Platform Testing:** Test the application thoroughly on iOS Safari and Android Chrome, addressing any device-specific issues.
-   **Touch Target Validation:** Verify that touch targets are adequate on all interactive elements, ensuring ease of interaction.
-   **Responsive Layout Checks:** Check responsive layouts at all breakpoints, ensuring that the application adapts fluidly to different screen sizes and orientations.
-   **Performance Monitoring:** Monitor the application's performance on mobile devices, addressing any performance bottlenecks.
-   **Documentation:** Document any mobile-specific patterns, techniques, or configurations used in the implementation.
