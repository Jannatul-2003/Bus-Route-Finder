# Accessibility Implementation

This document outlines the accessibility features implemented in the Dhaka Bus Route Planner application to ensure WCAG 2.1 AA compliance.

## Overview

The application has been designed with accessibility as a core principle, ensuring that all users, including those using assistive technologies, can effectively use the route planning features.

## Implemented Features

### 1. ARIA Labels and Roles

All interactive elements have appropriate ARIA labels and roles:

- **Buttons**: All buttons have descriptive `aria-label` attributes
- **Form Controls**: Input fields have `aria-required`, `aria-invalid`, and `aria-describedby` attributes
- **Dynamic Content**: Loading states use `aria-busy` attribute
- **Regions**: Major sections use `role="region"` with `aria-label`
- **Lists**: Bus results use `role="list"` and `role="listitem"`
- **Radio Groups**: Stop selection uses `role="radiogroup"` for proper grouping

### 2. Keyboard Navigation

Full keyboard navigation support has been implemented:

- **Tab Navigation**: All interactive elements are keyboard accessible
- **Enter/Space**: Stop selection cards respond to Enter and Space keys
- **Focus Indicators**: Enhanced focus indicators with 3px outline for visibility
- **Skip to Main Content**: Skip link allows keyboard users to bypass navigation
- **Focus Management**: Logical tab order throughout the application

### 3. Focus Indicators

Enhanced focus indicators meet WCAG AA standards:

- **Visible Outlines**: 3px solid outline with 2px offset
- **High Contrast**: Uses theme ring color for visibility
- **Consistent**: Applied to all focusable elements
- **Touch Targets**: Minimum 44x44px touch targets on mobile devices

### 4. Color Contrast

All text and interactive elements meet WCAG AA contrast requirements:

- **Text Contrast**: Minimum 4.5:1 ratio for normal text
- **Large Text**: Minimum 3:1 ratio for large text (18pt+)
- **Interactive Elements**: Sufficient contrast for buttons and links
- **Status Indicators**: Color is not the only means of conveying information

### 5. Screen Reader Support

Comprehensive screen reader announcements:

- **Live Regions**: `aria-live="polite"` for non-critical updates
- **Alerts**: `aria-live="assertive"` for errors and warnings
- **Status Updates**: Announcements for:
  - Search completion with stop count
  - Stop selection
  - Bus search results
  - Filter changes
- **Hidden Content**: Decorative icons use `aria-hidden="true"`
- **Screen Reader Only**: `.sr-only` class for additional context

### 6. Form Accessibility

All form controls are fully accessible:

- **Labels**: All inputs have associated `<label>` elements
- **Required Fields**: Marked with `aria-required="true"`
- **Error Messages**: Linked via `aria-describedby` and `role="alert"`
- **Validation**: Real-time validation with accessible error messages
- **Help Text**: Additional context provided via `aria-describedby`

### 7. Dynamic Content Updates

Dynamic content changes are announced to screen readers:

- **Search Results**: Count of stops and buses found
- **Filter Changes**: Updates to filtered results count
- **Selection Changes**: Confirmation of stop selections
- **Loading States**: "Searching" and "Loading" announcements

## Component-Specific Accessibility

### ThresholdInput Component

- Grouped with `role="group"` and `aria-labelledby`
- Input validation with `aria-invalid` and `aria-describedby`
- Error messages with `role="alert"`
- Checkbox for "no threshold" with proper labeling

### StopSelectionCard Component

- `role="radio"` for radio button behavior
- `aria-checked` for selection state
- `aria-label` with stop name and distance
- Keyboard navigation with Enter and Space keys
- Focus indicators on keyboard focus

### BusResultCard Component

- Semantic HTML structure
- Expandable details with `aria-expanded`
- All badges have `aria-label` for context
- Icons marked with `aria-hidden="true"`
- Additional details in `role="region"`

### FilterControls Component

- Grouped controls with `role="group"` and `aria-label`
- Toggle buttons with `aria-pressed` state
- Select dropdown with `aria-label`
- Sort order button with descriptive label

### RoutePlannerPage

- Skip to main content link
- Main landmark with `id="main-content"`
- Screen reader announcement region
- Error alerts with `role="alert"`
- Loading states with `aria-busy`
- Proper heading hierarchy

## Testing Recommendations

### Manual Testing

1. **Keyboard Navigation**
   - Tab through all interactive elements
   - Verify focus indicators are visible
   - Test Enter/Space on custom controls
   - Use skip link to jump to main content

2. **Screen Reader Testing**
   - Test with NVDA (Windows) or VoiceOver (Mac)
   - Verify all announcements are clear
   - Check form labels and error messages
   - Confirm dynamic updates are announced

3. **Color Contrast**
   - Use browser DevTools to check contrast ratios
   - Test in both light and dark modes
   - Verify focus indicators are visible

4. **Touch Targets**
   - Test on mobile devices
   - Verify all buttons are at least 44x44px
   - Check spacing between interactive elements

### Automated Testing

Use tools like:
- **axe DevTools**: Browser extension for accessibility testing
- **WAVE**: Web accessibility evaluation tool
- **Lighthouse**: Chrome DevTools accessibility audit
- **Pa11y**: Command-line accessibility testing

## WCAG 2.1 AA Compliance

The application meets the following WCAG 2.1 AA success criteria:

### Perceivable
- ✅ 1.1.1 Non-text Content (Level A)
- ✅ 1.3.1 Info and Relationships (Level A)
- ✅ 1.3.2 Meaningful Sequence (Level A)
- ✅ 1.3.3 Sensory Characteristics (Level A)
- ✅ 1.4.1 Use of Color (Level A)
- ✅ 1.4.3 Contrast (Minimum) (Level AA)
- ✅ 1.4.11 Non-text Contrast (Level AA)

### Operable
- ✅ 2.1.1 Keyboard (Level A)
- ✅ 2.1.2 No Keyboard Trap (Level A)
- ✅ 2.4.1 Bypass Blocks (Level A)
- ✅ 2.4.3 Focus Order (Level A)
- ✅ 2.4.6 Headings and Labels (Level AA)
- ✅ 2.4.7 Focus Visible (Level AA)
- ✅ 2.5.5 Target Size (Level AAA - implemented for AA)

### Understandable
- ✅ 3.1.1 Language of Page (Level A)
- ✅ 3.2.1 On Focus (Level A)
- ✅ 3.2.2 On Input (Level A)
- ✅ 3.3.1 Error Identification (Level A)
- ✅ 3.3.2 Labels or Instructions (Level A)
- ✅ 3.3.3 Error Suggestion (Level AA)

### Robust
- ✅ 4.1.1 Parsing (Level A)
- ✅ 4.1.2 Name, Role, Value (Level A)
- ✅ 4.1.3 Status Messages (Level AA)

## Future Enhancements

Potential accessibility improvements for future iterations:

1. **High Contrast Mode**: Support for Windows High Contrast mode
2. **Reduced Motion**: Respect `prefers-reduced-motion` media query
3. **Text Spacing**: Support for increased text spacing
4. **Zoom Support**: Ensure layout works at 200% zoom
5. **Voice Control**: Test with voice control software
6. **Internationalization**: Support for RTL languages

## Resources

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [WebAIM Resources](https://webaim.org/resources/)
- [A11y Project Checklist](https://www.a11yproject.com/checklist/)

## Contact

For accessibility concerns or suggestions, please open an issue in the project repository.
