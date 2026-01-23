# skin

A simple and fast Node.js proxy server for retrieving Minecraft player textures (skins, capes, and heads) from various systems including Ely.by, TLauncher, and Mojang.

## Features

* **Multi-source support**: Automatically searches for textures across multiple popular skin systems.
* **Head Generation**: Extracts the player's head from the skin and overlays the second layer (hat/accessory layer) for a complete look.
* **Caching**: Utilizes `node-cache` to store texture data (for 1 hour) and processed images (for 10 minutes) to reduce API latency and external requests.
* **Image Processing**: High-quality scaling using the `sharp` library with nearest-neighbor interpolation to preserve pixel art clarity.

## Tech Stack

* **Express**: Web framework for the API routes.
* **Axios**: HTTP client for fetching external textures.
* **Sharp**: High-performance image processing library.
* **Node-cache**: Internal caching mechanism.

## Installation

1. Clone the repository.
```bash
git clone https://github.com/aartzz/skin
cd skin
```

2. Install the dependencies:
```bash
npm install

```


3. Start the server:
```bash
node index.js

```


The server will run on port `3040` by default.

## API Endpoints

### 1. Get Player Data (JSON)

Returns the full texture data object containing URLs for the skin and cape.

* **URL**: `/:username`
* **Example**: `http://localhost:3000/ArtZabAZ`

### 2. Get Player Head (PNG)

Generates a 2D head image with the overlay layer.

* **URL**: `/head?username=%name%&size=%size%`
* **Parameters**:
* `username` (required): The player's nickname.
* `size` (optional): The pixel size for the image (width and height). Defaults to 64.


* **Example**: `http://localhost:3000/head?username=ArtZabAZ&size=128`

### 3. Get Skin File (PNG)

Fetches and returns the original skin texture file.

* **URL**: `/skin?username=%name%`
* **Example**: `http://localhost:3000/skin?username=ArtZabAZ`

### 4. Get Cape File (PNG)

Fetches and returns the player's cape texture if available.

* **URL**: `/cape?username=%name%`
* **Example**: `http://localhost:3000/cape?username=ArtZabAZ`