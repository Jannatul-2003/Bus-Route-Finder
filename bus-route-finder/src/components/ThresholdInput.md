# ThresholdInput Component

A modern, accessible input component for configuring distance thresholds in the bus route planning system.

## Features

- ✅ **Range Validation**: Enforces threshold values between 100-5000 meters
- ✅ **Visual Feedback**: Shows checkmark for valid values, error icon for invalid values
- ✅ **Real-time Validation**: Validates input as user types
- ✅ **Optional "No Threshold"**: Allows destination threshold to be disabled
- ✅ **Accessible**: Proper ARIA labels and keyboard navigation
- ✅ **Modern Design**: Rounded corners, shadows, smooth transitions
- ✅ **Error Messages**: Clear, helpful error messages for validation failures

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `value` | `number \| null` | Yes | - | Current threshold value in meters |
| `onChange` | `(value: number \| null) => void` | Yes | - | Callback when value changes |
| `label` | `string` | Yes | - | Label text for the input |
| `allowNoThreshold` | `boolean` | No | `false` | Show "no threshold" checkbox option |
| `className` | `string` | No | - | Additional CSS classes |
| `error` | `string` | No | - | External error message to display |

## Validation Rules

- **Minimum**: 100 meters
- **Maximum**: 5000 meters
- **Type**: Numeric only (non-numeric characters are rejected)
- **Required**: Cannot be empty (unless "no threshold" is checked)

## Usage Examples

### Basic Usage (Starting Location)

```tsx
import { ThresholdInput } from "@/components/ThresholdInput"

function MyComponent() {
  const [threshold, setThreshold] = useState<number | null>(500)

  return (
    <ThresholdInput
      value={threshold}
      onChange={setThreshold}
      label="Starting Location Threshold"
    />
  )
}
```

### With "No Threshold" Option (Destination)

```tsx
import { ThresholdInput } from "@/components/ThresholdInput"

function MyComponent() {
  const [threshold, setThreshold] = useState<number | null>(500)

  return (
    <ThresholdInput
      value={threshold}
      onChange={setThreshold}
      label="Destination Threshold"
      allowNoThreshold={true}
    />
  )
}
```

### With External Validation

```tsx
import { ThresholdInput } from "@/components/ThresholdInput"

function MyComponent() {
  const [threshold, setThreshold] = useState<number | null>(500)
  const [error, setError] = useState<string>("")

  const handleChange = (value: number | null) => {
    setThreshold(value)
    
    // Custom validation
    if (value && value > 2000) {
      setError("Large threshold may return many results")
    } else {
      setError("")
    }
  }

  return (
    <ThresholdInput
      value={threshold}
      onChange={handleChange}
      label="Custom Threshold"
      error={error}
    />
  )
}
```

## Visual States

### Valid State
- Green checkmark icon appears
- Green border color
- No error message

### Invalid State
- Red X icon appears
- Red border color
- Error message displayed below input

### Disabled State (No Threshold)
- Input is grayed out and disabled
- Checkbox is checked
- No validation performed

## Accessibility

- Proper `aria-invalid` attribute for invalid states
- `aria-describedby` links to error messages
- Keyboard navigation support
- Screen reader friendly labels and messages
- Focus indicators for all interactive elements

## Requirements Satisfied

This component satisfies the following requirements from the specification:

- **Requirement 1.1**: Display threshold input controls for both locations
- **Requirement 1.3**: Validate threshold values (100-5000m range)
- **Requirement 1.4**: Allow destination threshold to be null

## Testing

The component includes comprehensive unit tests covering:
- Rendering with default values
- Minimum/maximum threshold validation
- Valid value acceptance
- Visual feedback for valid/invalid states
- "No threshold" checkbox functionality
- Numeric-only input enforcement
- Empty input handling

Run tests with:
```bash
npm test -- src/components/__tests__/ThresholdInput.test.tsx
```
