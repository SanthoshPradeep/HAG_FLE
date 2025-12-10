// HAG-FLE Interactive Model - Main JavaScript

class HAGFLEModel {
    constructor() {
        this.svg = document.getElementById('main-svg');
        this.l1Layer = document.getElementById('l1-layer');
        this.l2Layer = document.getElementById('l2-layer');
        this.l3Layer = document.getElementById('l3-layer');
        this.dataFlowLayer = document.getElementById('data-flow-layer');
        this.tooltip = document.getElementById('tooltip');
        
        // System state
        this.deviceCount = 5;
        this.latency = 50;
        this.deviceLoad = 50;
        this.isPaused = false;
        this.trainingRound = 0;
        this.accuracy = 0;
        this.totalTransfer = 0;
        
        // Feature toggles
        this.features = {
            dsfl: true,
            mife: true,
            lwc: true,
            dao: true
        };
        
        // DSFL state
        this.cutLayer = 0.4; // 0-1, where model is split
        this.modelSize = 1000; // Total model size in units
        
        // Device data
        this.devices = [];
        this.aggregators = [];
        this.selectedDevice = null;
        
        // Animation frame
        this.animationId = null;
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.createInitialTopology();
        this.startSimulation();
        this.updateMetrics();
    }
    
    setupEventListeners() {
        // Control sliders
        document.getElementById('device-slider').addEventListener('input', (e) => {
            this.deviceCount = parseInt(e.target.value);
            document.getElementById('device-count').textContent = this.deviceCount;
            this.createInitialTopology();
        });
        
        document.getElementById('latency-slider').addEventListener('input', (e) => {
            this.latency = parseInt(e.target.value);
            document.getElementById('latency-value').textContent = this.latency;
        });
        
        document.getElementById('load-slider').addEventListener('input', (e) => {
            this.deviceLoad = parseInt(e.target.value);
            document.getElementById('load-value').textContent = this.deviceLoad;
        });
        
        // Toggle buttons
        document.getElementById('toggle-dsfl').addEventListener('click', (e) => {
            this.features.dsfl = !this.features.dsfl;
            e.target.classList.toggle('active');
            this.updateModelPartition();
        });
        
        document.getElementById('toggle-mife').addEventListener('click', (e) => {
            this.features.mife = !this.features.mife;
            e.target.classList.toggle('active');
            this.updateEncryptionVisualization();
        });
        
        document.getElementById('toggle-lwc').addEventListener('click', (e) => {
            this.features.lwc = !this.features.lwc;
            e.target.classList.toggle('active');
            this.updateEncryptionVisualization();
        });
        
        document.getElementById('toggle-dao').addEventListener('click', (e) => {
            this.features.dao = !this.features.dao;
            e.target.classList.toggle('active');
        });
        
        // Action buttons
        document.getElementById('reset-btn').addEventListener('click', () => {
            this.resetSimulation();
        });
        
        document.getElementById('pause-btn').addEventListener('click', () => {
            this.isPaused = !this.isPaused;
            document.getElementById('pause-btn').textContent = this.isPaused ? 'Resume' : 'Pause';
        });
        
        // Welcome modal
        document.getElementById('start-btn').addEventListener('click', () => {
            document.getElementById('welcome-modal').classList.add('hidden');
        });
        
        document.querySelector('.close-modal').addEventListener('click', () => {
            document.getElementById('welcome-modal').classList.add('hidden');
        });
        
        // SVG interactions
        this.svg.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.svg.addEventListener('click', (e) => this.handleClick(e));
        
        // Model partition interaction
        this.setupModelPartitionInteraction();
    }
    
    createInitialTopology() {
        // Clear existing
        this.l1Layer.innerHTML = '';
        this.l2Layer.innerHTML = '';
        this.dataFlowLayer.innerHTML = '';
        this.devices = [];
        this.aggregators = [];
        
        // Create aggregators (L2) - typically 2-3 aggregators
        const aggregatorCount = Math.max(2, Math.ceil(this.deviceCount / 3));
        const aggregatorPositions = this.calculateAggregatorPositions(aggregatorCount);
        
        aggregatorPositions.forEach((pos, idx) => {
            const agg = this.createAggregator(pos.x, pos.y, idx);
            this.aggregators.push(agg);
        });
        
        // Create devices (L1)
        const devicePositions = this.calculateDevicePositions(this.deviceCount, aggregatorPositions);
        
        devicePositions.forEach((pos, idx) => {
            const device = this.createDevice(pos.x, pos.y, idx);
            this.devices.push(device);
            
            // Connect to nearest aggregator
            const nearestAgg = this.findNearestAggregator(pos, aggregatorPositions);
            this.aggregators[nearestAgg].devicesConnected++;
            this.createDataFlow(device, this.aggregators[nearestAgg], 'l1-l2');
        });
        
        // Connect aggregators to server
        const l3Server = document.getElementById('l3-server');
        this.aggregators.forEach(agg => {
            this.createDataFlow(agg, l3Server, 'l2-l3');
        });
        
        this.updateModelPartition();
    }
    
    calculateAggregatorPositions(count) {
        const positions = [];
        const centerX = 600;
        const startY = 300;
        const spacing = 200;
        
        for (let i = 0; i < count; i++) {
            const offset = (i - (count - 1) / 2) * spacing;
            positions.push({
                x: centerX + offset,
                y: startY
            });
        }
        
        return positions;
    }
    
    calculateDevicePositions(count, aggregatorPositions) {
        const positions = [];
        const startY = 550;
        const baseSpacing = 150;
        const perRow = Math.ceil(Math.sqrt(count));
        
        for (let i = 0; i < count; i++) {
            const row = Math.floor(i / perRow);
            const col = i % perRow;
            const totalInRow = Math.min(perRow, count - row * perRow);
            const rowWidth = (totalInRow - 1) * baseSpacing;
            const startX = 600 - rowWidth / 2;
            
            positions.push({
                x: startX + col * baseSpacing + (Math.random() - 0.5) * 30,
                y: startY + row * 100 + (Math.random() - 0.5) * 30
            });
        }
        
        return positions;
    }
    
    findNearestAggregator(devicePos, aggregatorPositions) {
        let minDist = Infinity;
        let nearestIdx = 0;
        
        aggregatorPositions.forEach((aggPos, idx) => {
            const dist = Math.sqrt(
                Math.pow(devicePos.x - aggPos.x, 2) + 
                Math.pow(devicePos.y - aggPos.y, 2)
            );
            if (dist < minDist) {
                minDist = dist;
                nearestIdx = idx;
            }
        });
        
        return nearestIdx;
    }
    
    createDevice(x, y, id) {
        const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        g.setAttribute('class', 'device-node');
        g.setAttribute('data-id', `l1-${id}`);
        g.setAttribute('data-type', 'device');
        
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', x);
        circle.setAttribute('cy', y);
        circle.setAttribute('r', 25);
        circle.setAttribute('fill', 'url(#deviceGradient)');
        circle.setAttribute('stroke', '#fff');
        circle.setAttribute('stroke-width', '2');
        
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', x);
        text.setAttribute('y', y + 5);
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('fill', 'white');
        text.setAttribute('font-size', '12');
        text.setAttribute('font-weight', 'bold');
        text.textContent = `D${id + 1}`;
        
        // EIS badge
        const eis = (Math.random() * 50 + 50).toFixed(1);
        const eisText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        eisText.setAttribute('x', x);
        eisText.setAttribute('y', y + 40);
        eisText.setAttribute('text-anchor', 'middle');
        eisText.setAttribute('fill', '#4CAF50');
        eisText.setAttribute('font-size', '10');
        eisText.setAttribute('font-weight', 'bold');
        eisText.textContent = `EIS: ${eis}`;
        
        g.appendChild(circle);
        g.appendChild(text);
        g.appendChild(eisText);
        
        this.l1Layer.appendChild(g);
        
        return {
            element: g,
            id: id,
            x: x,
            y: y,
            eis: parseFloat(eis),
            cpu: Math.random() * 30 + 20,
            memory: Math.random() * 50 + 30,
            dataContributed: 0
        };
    }
    
    createAggregator(x, y, id) {
        const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        g.setAttribute('class', 'aggregator-node');
        g.setAttribute('data-id', `l2-${id}`);
        g.setAttribute('data-type', 'aggregator');
        
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('x', x - 50);
        rect.setAttribute('y', y - 30);
        rect.setAttribute('width', 100);
        rect.setAttribute('height', 60);
        rect.setAttribute('rx', '8');
        rect.setAttribute('fill', 'url(#aggregatorGradient)');
        rect.setAttribute('stroke', '#fff');
        rect.setAttribute('stroke-width', '2');
        
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', x);
        text.setAttribute('y', y - 5);
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('fill', 'white');
        text.setAttribute('font-size', '12');
        text.setAttribute('font-weight', 'bold');
        text.textContent = `Agg ${id + 1}`;
        
        const subtext = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        subtext.setAttribute('x', x);
        subtext.setAttribute('y', y + 15);
        subtext.setAttribute('text-anchor', 'middle');
        subtext.setAttribute('fill', 'white');
        subtext.setAttribute('font-size', '10');
        subtext.textContent = 'L2';
        
        g.appendChild(rect);
        g.appendChild(text);
        g.appendChild(subtext);
        
        this.l2Layer.appendChild(g);
        
        return {
            element: g,
            id: id,
            x: x,
            y: y,
            devicesConnected: 0
        };
    }
    
    createDataFlow(fromDeviceOrAgg, toAggOrServer, type) {
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('class', 'data-flow');
        path.setAttribute('data-type', type);
        
        // Get coordinates
        let fromPoint, toPoint;
        
        // Handle from point
        if (fromDeviceOrAgg && fromDeviceOrAgg.x !== undefined) {
            // It's a device or aggregator object
            fromPoint = { x: fromDeviceOrAgg.x, y: fromDeviceOrAgg.y };
        } else if (fromDeviceOrAgg && fromDeviceOrAgg.element) {
            // It's an object with element property
            fromPoint = this.getSVGPoint(fromDeviceOrAgg.element);
        } else {
            // It's an element
            fromPoint = this.getSVGPoint(fromDeviceOrAgg);
        }
        
        // Handle to point
        if (toAggOrServer === document.getElementById('l3-server') || 
            (toAggOrServer && toAggOrServer.id === 'l3-server')) {
            toPoint = { x: 600, y: 110 }; // L3 server center
        } else if (toAggOrServer && toAggOrServer.x !== undefined) {
            // It's an aggregator object
            toPoint = { x: toAggOrServer.x, y: toAggOrServer.y };
        } else if (toAggOrServer && toAggOrServer.element) {
            // It's an object with element property
            toPoint = this.getSVGPoint(toAggOrServer.element);
        } else {
            // It's an element
            toPoint = this.getSVGPoint(toAggOrServer);
        }
        
        const midX = (fromPoint.x + toPoint.x) / 2;
        const controlY = Math.min(fromPoint.y, toPoint.y) - 50;
        
        const d = `M ${fromPoint.x} ${fromPoint.y} Q ${midX} ${controlY} ${toPoint.x} ${toPoint.y}`;
        path.setAttribute('d', d);
        
        if (this.features.lwc || this.features.mife) {
            path.classList.add('encrypted');
        } else {
            path.classList.add('normal');
        }
        
        this.dataFlowLayer.appendChild(path);
        
        return path;
    }
    
    getSVGPoint(element) {
        if (element.tagName === 'circle') {
            return {
                x: parseFloat(element.getAttribute('cx')),
                y: parseFloat(element.getAttribute('cy'))
            };
        } else if (element.tagName === 'rect') {
            return {
                x: parseFloat(element.getAttribute('x')) + parseFloat(element.getAttribute('width')) / 2,
                y: parseFloat(element.getAttribute('y')) + parseFloat(element.getAttribute('height')) / 2
            };
        } else if (element.tagName === 'g') {
            const child = element.querySelector('circle, rect');
            if (child) return this.getSVGPoint(child);
            // Fallback: try to get from stored coordinates
            const device = this.devices.find(d => d.element === element);
            if (device) return { x: device.x, y: device.y };
            const agg = this.aggregators.find(a => a.element === element);
            if (agg) return { x: agg.x, y: agg.y };
        }
        return { x: 0, y: 0 };
    }
    
    setupModelPartitionInteraction() {
        const partitionViz = document.getElementById('model-partition-viz');
        const cutLayerLine = document.getElementById('cut-layer-line');
        const totalWidth = 1100;
        const startX = 60;
        
        let isDragging = false;
        
        const updateCutLayer = (x) => {
            const relativeX = Math.max(0, Math.min(1, (x - startX) / totalWidth));
            this.cutLayer = relativeX;
            this.updateModelPartition();
        };
        
        cutLayerLine.addEventListener('mousedown', (e) => {
            isDragging = true;
        });
        
        partitionViz.addEventListener('mousemove', (e) => {
            if (isDragging && this.features.dsfl) {
                const rect = partitionViz.getBoundingClientRect();
                const x = e.clientX - rect.left;
                updateCutLayer(x);
            }
        });
        
        document.addEventListener('mouseup', () => {
            isDragging = false;
        });
        
        partitionViz.addEventListener('click', (e) => {
            if (this.features.dsfl) {
                const rect = partitionViz.getBoundingClientRect();
                const x = e.clientX - rect.left;
                updateCutLayer(x);
            }
        });
    }
    
    updateModelPartition() {
        if (!this.features.dsfl) {
            document.getElementById('model-partition-viz').style.opacity = '0';
            return;
        }
        
        document.getElementById('model-partition-viz').style.opacity = '1';
        
        const totalWidth = 1100;
        const startX = 60;
        const height = 50;
        const y = 690;
        
        // Calculate partition sizes based on cut layer and device load
        const l1Size = this.cutLayer * 0.4 * totalWidth; // L1 handles 40% of cut layer
        const l2Size = this.cutLayer * 0.6 * totalWidth; // L2 handles 60% of cut layer
        const l3Size = (1 - this.cutLayer) * totalWidth; // L3 handles the rest
        
        const l1Partition = document.getElementById('l1-partition');
        const l2Partition = document.getElementById('l2-partition');
        const l3Partition = document.getElementById('l3-partition');
        const cutLayerLine = document.getElementById('cut-layer-line');
        const cutLayerLabel = document.getElementById('cut-layer-label');
        
        l1Partition.setAttribute('x', startX);
        l1Partition.setAttribute('width', l1Size);
        
        l2Partition.setAttribute('x', startX + l1Size);
        l2Partition.setAttribute('width', l2Size);
        
        l3Partition.setAttribute('x', startX + l1Size + l2Size);
        l3Partition.setAttribute('width', l3Size);
        
        const cutX = startX + this.cutLayer * totalWidth;
        cutLayerLine.setAttribute('x1', cutX);
        cutLayerLine.setAttribute('x2', cutX);
        cutLayerLabel.setAttribute('x', cutX);
        cutLayerLabel.textContent = `Cut Layer: ${(this.cutLayer * 100).toFixed(0)}%`;
    }
    
    updateEncryptionVisualization() {
        const flows = this.dataFlowLayer.querySelectorAll('.data-flow');
        flows.forEach(flow => {
            if (this.features.lwc || this.features.mife) {
                flow.classList.add('encrypted');
                flow.classList.remove('normal');
            } else {
                flow.classList.add('normal');
                flow.classList.remove('encrypted');
            }
        });
    }
    
    handleMouseMove(e) {
        const rect = this.svg.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // Convert to SVG coordinates
        const svgPoint = this.svg.createSVGPoint();
        svgPoint.x = e.clientX;
        svgPoint.y = e.clientY;
        const ctm = this.svg.getScreenCTM();
        if (ctm) {
            svgPoint.x = (svgPoint.x - ctm.e) / ctm.a;
            svgPoint.y = (svgPoint.y - ctm.f) / ctm.d;
        }
        
        // Check what element is under the cursor
        const element = document.elementFromPoint(e.clientX, e.clientY);
        if (!element) {
            this.hideTooltip();
            return;
        }
        
        let target = element.closest('[data-type]');
        if (!target && (element.id === 'l3-server' || element.closest('#l3-layer'))) {
            target = document.getElementById('l3-server');
        }
        
        if (target) {
            this.showTooltip(target, e.clientX - rect.left, e.clientY - rect.top);
        } else {
            this.hideTooltip();
        }
    }
    
    showTooltip(element, x, y) {
        const type = element.getAttribute('data-type');
        const id = element.getAttribute('data-id');
        let content = '';
        
        if (type === 'device') {
            const device = this.devices.find(d => d.element === element);
            if (device) {
                content = `
                    <strong>TinyML Device ${device.id + 1}</strong><br>
                    EIS Score: ${device.eis.toFixed(1)}<br>
                    CPU Usage: ${device.cpu.toFixed(1)}%<br>
                    Memory: ${device.memory.toFixed(1)} MB<br>
                    Data Contributed: ${device.dataContributed.toFixed(2)} MB<br>
                    ${this.features.mife ? '✓ MIFE Encryption Active' : '✗ MIFE Encryption Inactive'}<br>
                    ${this.features.lwc ? '✓ LWC Protection Active' : '✗ LWC Protection Inactive'}
                `;
            }
        } else if (type === 'aggregator') {
            const agg = this.aggregators.find(a => a.element === element);
            if (agg) {
                content = `
                    <strong>Aggregator ${agg.id + 1} (L2)</strong><br>
                    Devices Connected: ${agg.devicesConnected}<br>
                    Aggregating updates from L1 devices<br>
                    ${this.features.dsfl ? '✓ DSFL Active - Processing model partition' : '✗ DSFL Inactive'}
                `;
            }
        } else if (element.id === 'l3-server' || element.closest('#l3-layer')) {
            content = `
                <strong>Global Server (L3)</strong><br>
                Model Accuracy: ${this.accuracy.toFixed(2)}%<br>
                Training Round: ${this.trainingRound}<br>
                Total Data Received: ${(this.totalTransfer / 1024).toFixed(2)} GB<br>
                ${this.features.dsfl ? '✓ DSFL Active - Final model aggregation' : '✗ DSFL Inactive'}
            `;
        }
        
        if (content) {
            this.tooltip.innerHTML = content;
            this.tooltip.classList.add('show');
            this.tooltip.style.left = (x + 15) + 'px';
            this.tooltip.style.top = (y + 15) + 'px';
        }
    }
    
    hideTooltip() {
        this.tooltip.classList.remove('show');
    }
    
    handleClick(e) {
        let element = e.target.closest('[data-type]');
        if (!element && e.target.id === 'l3-server') {
            element = e.target;
        }
        if (element) {
            this.selectDevice(element);
        }
    }
    
    selectDevice(element) {
        // Remove previous selection
        if (this.selectedDevice) {
            if (this.selectedDevice.tagName === 'rect' && this.selectedDevice.id === 'l3-server') {
                this.selectedDevice.classList.remove('selected');
            } else {
                const prevCircle = this.selectedDevice.querySelector('circle');
                const prevRect = this.selectedDevice.querySelector('rect');
                if (prevCircle) prevCircle.classList.remove('selected');
                if (prevRect) prevRect.classList.remove('selected');
            }
        }
        
        this.selectedDevice = element;
        
        if (element.id === 'l3-server') {
            element.classList.add('selected');
        } else {
            const circle = element.querySelector('circle');
            const rect = element.querySelector('rect');
            if (circle) circle.classList.add('selected');
            if (rect) rect.classList.add('selected');
        }
        
        const type = element.getAttribute('data-type');
        const infoDiv = document.getElementById('device-info');
        
        if (type === 'device') {
            const device = this.devices.find(d => d.element === element);
            if (device) {
                const reward = (device.eis * device.dataContributed / 100).toFixed(2);
                infoDiv.innerHTML = `
                    <p><strong>Device ${device.id + 1} Details:</strong></p>
                    <p>EIS Score: <strong>${device.eis.toFixed(1)}</strong></p>
                    <p>CPU: <strong>${device.cpu.toFixed(1)}%</strong></p>
                    <p>Memory: <strong>${device.memory.toFixed(1)} MB</strong></p>
                    <p>Data Contributed: <strong>${device.dataContributed.toFixed(2)} MB</strong></p>
                    <p>DAO Reward: <strong>${reward} tokens</strong></p>
                    <p>Encryption: ${this.features.mife ? 'MIFE ✓' : '✗'} ${this.features.lwc ? 'LWC ✓' : '✗'}</p>
                `;
            }
        } else if (type === 'aggregator') {
            const agg = this.aggregators.find(a => a.element === element);
            if (agg) {
                infoDiv.innerHTML = `
                    <p><strong>Aggregator ${agg.id + 1} Details:</strong></p>
                    <p>Layer: <strong>L2</strong></p>
                    <p>Devices Connected: <strong>${agg.devicesConnected}</strong></p>
                    <p>Function: Aggregating model updates</p>
                    <p>DSFL: ${this.features.dsfl ? 'Active ✓' : 'Inactive ✗'}</p>
                `;
            }
        } else if (element.id === 'l3-server' || element.closest('#l3-layer')) {
            infoDiv.innerHTML = `
                <p><strong>Global Server Details:</strong></p>
                <p>Layer: <strong>L3</strong></p>
                <p>Model Accuracy: <strong>${this.accuracy.toFixed(2)}%</strong></p>
                <p>Training Round: <strong>${this.trainingRound}</strong></p>
                <p>Total Data: <strong>${(this.totalTransfer / 1024).toFixed(2)} GB</strong></p>
                <p>DSFL: ${this.features.dsfl ? 'Active ✓' : 'Inactive ✗'}</p>
            `;
        }
    }
    
    startSimulation() {
        const animate = () => {
            if (!this.isPaused) {
                this.updateSimulation();
            }
            this.animationId = requestAnimationFrame(animate);
        };
        animate();
    }
    
    updateSimulation() {
        // Update device states
        this.devices.forEach(device => {
            // Simulate data collection
            device.dataContributed += Math.random() * 0.1;
            
            // Update CPU and memory based on load
            device.cpu = Math.min(100, device.cpu + (Math.random() - 0.5) * 5);
            device.memory = Math.min(200, device.memory + (Math.random() - 0.5) * 2);
            
            // Update EIS based on contribution
            device.eis = Math.min(100, device.eis + device.dataContributed * 0.01);
        });
        
        // Update aggregator connections
        this.aggregators.forEach(agg => {
            agg.devicesConnected = Math.floor(this.deviceCount / this.aggregators.length);
        });
        
        // Update training metrics
        if (Math.random() > 0.95) {
            this.trainingRound++;
            this.accuracy = Math.min(95, this.accuracy + Math.random() * 2);
            this.totalTransfer += Math.random() * 10;
        }
        
        // Dynamic cut layer adjustment based on device load
        if (this.features.dsfl) {
            const avgLoad = this.devices.reduce((sum, d) => sum + d.cpu, 0) / this.devices.length;
            const targetCutLayer = 1 - (avgLoad / 100) * 0.6; // Adjust cut layer based on load
            this.cutLayer = this.cutLayer * 0.95 + targetCutLayer * 0.05; // Smooth transition
            this.updateModelPartition();
        }
        
        // Update visual effects
        this.updateDeviceVisuals();
        this.updateMetrics();
    }
    
    updateDeviceVisuals() {
        this.devices.forEach(device => {
            const circle = device.element.querySelector('circle');
            const intensity = device.cpu / 100;
            circle.style.opacity = 0.7 + intensity * 0.3;
            
            if (device.cpu > 80) {
                circle.classList.add('pulse');
            } else {
                circle.classList.remove('pulse');
            }
        });
    }
    
    updateMetrics() {
        document.getElementById('accuracy-value').textContent = this.accuracy.toFixed(2) + '%';
        document.getElementById('round-value').textContent = this.trainingRound;
        document.getElementById('transfer-value').textContent = (this.totalTransfer / 1024).toFixed(2) + ' MB';
        
        const avgCpu = this.devices.reduce((sum, d) => sum + d.cpu, 0) / this.devices.length || 0;
        const avgMemory = this.devices.reduce((sum, d) => sum + d.memory, 0) / this.devices.length || 0;
        
        document.getElementById('cpu-value').textContent = avgCpu.toFixed(1) + '%';
        document.getElementById('memory-value').textContent = avgMemory.toFixed(1) + ' MB';
        document.getElementById('delay-value').textContent = this.latency + ' ms';
        
        document.getElementById('participants-value').textContent = this.deviceCount;
        const avgEIS = this.devices.reduce((sum, d) => sum + d.eis, 0) / this.devices.length || 0;
        document.getElementById('eis-value').textContent = avgEIS.toFixed(1);
        
        const totalRewards = this.devices.reduce((sum, d) => 
            sum + (d.eis * d.dataContributed / 100), 0);
        document.getElementById('rewards-value').textContent = totalRewards.toFixed(2) + ' tokens';
    }
    
    resetSimulation() {
        this.trainingRound = 0;
        this.accuracy = 0;
        this.totalTransfer = 0;
        this.cutLayer = 0.4;
        
        this.devices.forEach(device => {
            device.dataContributed = 0;
            device.cpu = Math.random() * 30 + 20;
            device.memory = Math.random() * 50 + 30;
            device.eis = Math.random() * 50 + 50;
        });
        
        this.updateModelPartition();
        this.updateMetrics();
    }
}

// Initialize the model when page loads
document.addEventListener('DOMContentLoaded', () => {
    new HAGFLEModel();
});

