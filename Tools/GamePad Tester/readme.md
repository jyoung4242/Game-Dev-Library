# Gamepad Tester

A simple web-based tool to test and visualize your gamepad/controller inputs in real-time.

## What It Does

Gamepad Tester helps you verify that your game controllers are working properly by showing you exactly what's happening when you press
buttons, move sticks, or use triggers. It's perfect for troubleshooting controller issues, checking button mappings, or just seeing how
your gamepad responds.

## Features

- **Real-time Monitoring**: See button presses, stick movements, and trigger values update instantly
- **Visual Feedback**: Watch analog sticks move on screen as you control them
- **Multiple Controllers**: Test multiple gamepads at the same time
- **Button States**: View which buttons are pressed and their pressure values
- **Axis Visualization**: See all analog axes as progress bars with center indicators
- **Debug Information**: Access raw controller data for advanced users
- **Responsive Design**: Works on desktop and mobile devices

## How to Use

1. **Open the Tool**: Open `index.html` in your web browser
2. **Connect Your Controller**: Plug in your gamepad via USB or connect via Bluetooth
3. **Activate the Controller**: Press any button on your controller to wake it up
4. **Test Your Inputs**:
   - Press buttons to see them light up
   - Move analog sticks to watch the visual indicators
   - Pull triggers to see value changes
   - Use D-pad and other controls

## Requirements

- A modern web browser that supports the Gamepad API
- A compatible game controller (Xbox, PlayStation, Nintendo Switch, or generic USB/Bluetooth controllers)

## Browser Compatibility

Works in:

- Chrome/Chromium (recommended)
- Firefox
- Edge
- Safari (limited support)

**Note**: Some older browsers or mobile browsers may not support gamepad input.

## Troubleshooting

### Controller Not Detected

- Make sure your controller is properly connected and turned on
- Try pressing buttons on the controller while the page is open
- Some controllers need to be "paired" first in your system's Bluetooth settings

### Sticks or Buttons Not Responding

- Check that your controller is compatible with the Gamepad API
- Try a different browser
- Some controllers may require specific drivers

### Performance Issues

- Close other browser tabs to free up resources
- The tool updates at 60fps, so very old computers may struggle

## Technical Details

This tool uses the browser's Gamepad API to read controller input directly. No installation or special permissions required - just open
the HTML file in a compatible browser.

## Privacy

This tool runs entirely in your browser and doesn't send any data anywhere. Your controller inputs stay private on your
device.</content> <parameter name="filePath">README.md
