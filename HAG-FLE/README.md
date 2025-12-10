# HAG-FLE Interactive Model

An interactive visualization and simulation of the HAG-FLE (Hierarchical Aggregated Green Federated Learning Ecosystem) framework for decentralized environmental monitoring.

## Features

### 1. Three-Tier Architecture Visualization
- **L1 (TinyML Devices)**: Edge devices collecting environmental data
- **L2 (Aggregators)**: Intermediate nodes aggregating updates from L1 devices
- **L3 (Global Server)**: Central server for model aggregation and decision-making

### 2. Dynamic Split-Fed Learning (DSFL)
- Interactive model partition visualization
- Drag the cut-layer line to adjust model partitioning
- Real-time adaptation based on device load and network conditions
- Visual representation of how the model is split between L1, L2, and L3

### 3. Privacy Mechanisms
- **Multi-Input Functional Encryption (MIFE)**: Toggle to see encrypted model updates
- **Lightweight Cryptography (LWC)**: Visual indication of encrypted data streams
- Encryption status shown on data flow lines and device tooltips

### 4. HAG-DAO Governance
- **Environmental Impact Score (EIS)**: Displayed for each device
- Real-time reward calculation based on data contribution and EIS
- Governance metrics in the metrics panel

### 5. Interactive Controls
- Adjust number of L1 devices (3-15)
- Control network latency (10-200ms)
- Adjust device load (10-100%)
- Toggle features: DSFL, MIFE, LWC, DAO
- Pause/Resume simulation
- Reset simulation

### 6. Real-Time Metrics
- Training accuracy and round number
- Data transfer volume
- CPU and memory usage
- Network delay
- EIS scores and DAO rewards

## Usage

1. Open `index.html` in a modern web browser
2. Read the welcome message and click "Start Exploring"
3. **Hover** over devices, aggregators, or the server to see detailed information
4. **Click** on any node to see detailed metrics in the right panel
5. **Adjust sliders** to experiment with different network conditions
6. **Toggle features** to see how DSFL, MIFE, LWC, and DAO affect the system
7. **Drag the cut-layer line** in the model partition visualization to adjust DSFL partitioning

## File Structure

- `index.html` - Main HTML structure
- `styles.css` - Styling and animations
- `script.js` - Core simulation and interactivity logic

## Browser Compatibility

Works best in modern browsers that support:
- SVG animations
- CSS Grid
- ES6 JavaScript features
- requestAnimationFrame API

## Key Interactions

- **Hover**: See tooltips with device/aggregator/server information
- **Click**: Select a node to see detailed metrics
- **Drag**: Adjust the DSFL cut-layer in the model partition view
- **Sliders**: Modify system parameters in real-time
- **Toggle Buttons**: Enable/disable features to see their impact

Enjoy exploring the HAG-FLE framework!

