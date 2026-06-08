# ComfyUI Local Stub Run Guide

This directory contains a lightweight local Node.js stub simulating the ComfyUI specialist module pipeline.

## Prerequisites
- Node.js (v18 or higher recommended)

## Running the Server
To launch the server locally on port `8188`:
```bash
cd modules/comfyui-pipeline
npm start
```

## Available Endpoints
- **GET /health**: Liveness check probe.
- **POST /run**: Executes request payload validation and schedules mockup generation tasks.
- **POST /simulate-callback**: Simulates completions and failures callback responses.
