<script>
    let canvas = $state(null);

    let displayWidth = $state(1920);
    let displayHeight = $state(1080);
    let gridSize = $state(24);

    const gridSizeMin = 2;
    const gridSizeMax = 48;

    const canvasWidth = $derived(Number(displayWidth) || 0);
    const canvasHeight = $derived(Number(displayHeight) || 0);

    const gridFillPercent = $derived(
        ((gridSize - gridSizeMin) / (gridSizeMax - gridSizeMin)) * 100
    );

    $effect(() => {
        if (!canvas || canvasWidth <= 0 || canvasHeight <= 0) return;

        canvas.width = canvasWidth;
        canvas.height = canvasHeight;
        draw(canvas.getContext('2d'), canvasWidth, canvasHeight, gridSize);
    });

    let mouseCoordinate = $state({x:0, y:0});
    
    function handleMouseMove(){
        mouseCoordinate.x = event.clientX;
        mouseCoordinate.y = event.clientY;
        
        console.log(mouseCoordinate.x)
    }
    
    function drawGrid(ctx, x1, y1, x2, y2) {
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.lineWidth = 1;
        ctx.strokeStyle = "rgba(0, 0, 0, 0.1)";
        ctx.stroke();
    }
    
    function drawCircle(ctx, x, y) {
        ctx.beginPath();
        ctx.arc(x, y, 1, 0, 2 * Math.PI);
        ctx.fillStyle = "#9CA9BF";
        ctx.fill();
    }
    
    function draw(ctx, width, height, size) {
        ctx.clearRect(0, 0, width, height);
        
        const gridSegmentWidth = width / size;
        const gridSegmentHeight = height / size;
        
        const interactionPointsX = [];
        const interactionPointsY = [];

        for (let i = 1; i < size; i++) {
            interactionPointsX.push(gridSegmentWidth * i);
            interactionPointsY.push(gridSegmentHeight * i);
            drawGrid(ctx, gridSegmentWidth * i, 0, gridSegmentWidth * i, height);
            drawGrid(ctx, 0, gridSegmentHeight * i, width, gridSegmentHeight * i);
        }

        for (let i = 0; i < interactionPointsX.length; i++) {
            for (let j = 0; j < interactionPointsY.length; j++) {
                drawCircle(ctx, interactionPointsX[i], interactionPointsY[j]);
            }
        }
    }
</script>

<style>
  :global(body) {
    height: 100dvh;
    width: 100vw;
    font-family: 'Segoe UI', Arial, sans-serif;
    margin: 0;
    padding: 24px;
    background-color: #f1f5f9;
    color: #0f172a;
    box-sizing: border-box;
    overflow: hidden;
  }

  .header{
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 50px;
    max-width: 1800px;
    margin: 0 auto 20px auto;
  }

  .logo-section {
    display: flex;
    align-items: center;
    font-size: 20px;
    color: #1E293B;

    .subtitle{
        font-size: 12px;
        color: #475569;
        font-weight: 500;
    }
  }

  .app-layout {
    display: grid;
    grid-template-columns: 380px 1fr;
    gap: 24px;
    align-items: stretch;
    max-width: 1800px;
    height: calc(100dvh - 110px);
    margin: 0 auto;
  }

  .selection-section {
    display: flex;
    height: 100%;
    flex-direction: column;
    gap: 16px;
    background: #ffffff;
    padding: 20px;
    border-radius: 8px;
    border: 1px solid #e2e8f0;
    box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    max-height: 100%;
    overflow-y: auto;
    box-sizing: border-box;
    min-height: 0;
  }

  #select-display-dimensions{
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: flex-start;
    gap: 12px;
  }

  #select-display-dimensions .input-group {
    flex: 1;
  }

  .input-group {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    text-align: left;
    gap: 6px;
    font-weight: 600;
    font-size: 13px;
    color: #475569;
  }

  .input-group:has(input[type="range"]) {
    gap: 0;
  }

  .field-hint {
    font-weight: 400;
    font-size: 12px;
    color: #94a3b8;
  }

  .input-group input {
    padding: 8px 12px;
    border: 1px solid #cbd5e1;
    border-radius: 6px;
    font-size: 14px;
    background-color: #f8fafc;
    color: #0f172a;
  }

  .selection-section input[type="text"] {
    width: 100%;
    height: 38px;
    padding: 8px 12px;
    border: 1px solid #cbd5e1;
    border-radius: 6px;
    font-size: 14px;
    background-color: #FFFFFF;
    color: #0f172a;
    box-sizing: border-box;
    text-align: left;
  }

  fieldset {
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    padding: 12px 14px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    background: #f8fafc;
    margin: 0;
  }

  legend {
    font-weight: 600;
    font-size: 13px;
    color: #334155;
    padding: 0 6px;
  }

  label {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 13px;
    color: #334155;
    cursor: pointer;
  }

  input[type="range"] {
    -webkit-appearance: none;
    appearance: none;
    width: 100%;
    height: 20px;
    margin: 0;
    padding: 0;
    border: none;
    background: transparent;
    cursor: pointer;
  }

  /* Track — filled portion driven by --fill, set inline from the bound value */
  input[type="range"]::-webkit-slider-runnable-track {
    height: 6px;
    border-radius: 999px;
    border: 1px solid #cbd5e1;
    background:
      linear-gradient(#2563eb, #2563eb) 0 / var(--fill, 50%) 100% no-repeat,
      #e2e8f0;
  }

  input[type="range"]::-moz-range-track {
    height: 6px;
    border-radius: 999px;
    border: 1px solid #cbd5e1;
    background: #e2e8f0;
  }

  input[type="range"]::-moz-range-progress {
    height: 6px;
    border-radius: 999px;
    background-color: #2563eb;
  }

  input[type="range"]::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 12px;
    height: 12px;
    margin-top: -6px; /* centers the 16px thumb on the 6px track */
    border-radius: 50%;
    background-color: #ffffff;
    border: 2px solid #2563eb;
    box-shadow: 0 1px 3px rgba(0,0,0,0.15);
    transition: background-color 0.15s ease, border-color 0.15s ease, transform 0.15s ease;
  }

  input[type="range"]::-moz-range-thumb {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background-color: #ffffff;
    border: 2px solid #2563eb;
    box-shadow: 0 1px 3px rgba(0,0,0,0.15);
    transition: background-color 0.15s ease, border-color 0.15s ease, transform 0.15s ease;
  }

  input[type="range"]:hover::-webkit-slider-thumb {
    background-color: #eff6ff;
    border-color: #1d4ed8;
  }

  input[type="range"]:hover::-moz-range-thumb {
    background-color: #eff6ff;
    border-color: #1d4ed8;
  }

  input[type="range"]:active::-webkit-slider-thumb {
    background-color: #2563eb;
    transform: scale(1.1);
  }

  input[type="range"]:active::-moz-range-thumb {
    background-color: #2563eb;
    transform: scale(1.1);
  }

  input[type="range"]:focus {
    outline: none;
  }

  input[type="range"]:focus-visible::-webkit-slider-thumb {
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.25);
  }

  input[type="range"]:focus-visible::-moz-range-thumb {
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.25);
  }

  .viewer-section {
    height: 100%;
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 24px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    display: flex;
    flex-direction: column;
    align-items: center;
    box-sizing: border-box;
    min-height: 0;
  }

  .canvas-container {
    width: 100%;
    max-width: 100%;
    flex: 1;
    min-height: 0;
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: #ffffff;
    border: 1px solid #cbd5e1;
    border-radius: 6px;
    overflow: hidden;
  }

  canvas {
    max-width: 100%;
    max-height: 100%;
    width: auto;
    height: auto;
    display: block;
    background-color: #ffffff;
  }
</style>

<title>Project Pathfinder</title>
<div class="header">
    <div class="logo-section">
        <div class="title">
            <div class="title">Project Pathfinder</div>
            <div class="subtitle">Grid Path Generator v0.0.1</div>
        </div>
    </div>
</div>

<div class="app-layout">
  <div class="selection-section">
    <fieldset id="select-display-dimensions">
      <legend>Select Display Dimensions</legend>
      <label class="input-group" for="width">
        <input id="width" type="text" bind:value={displayWidth}>
      </label>
      x
      <label class="input-group" for="height">
        <input id="height" type="text" bind:value={displayHeight}>
      </label>
    </fieldset>

    <fieldset id="select-layout-adjustments">
      <legend>Layout Adjustments</legend>
      <label class="input-group" for="grid-size">
        <span class="field-hint">Grid Size</span>
        <input type="range" name="grid-size" id="grid-size" min={gridSizeMin} max={gridSizeMax} bind:value={gridSize} style="--fill: {gridFillPercent}%">
      </label>
    </fieldset>
  </div>

  <div class="viewer-section">
    <div class="canvas-container" onmousemove={handleMouseMove}>
      <canvas bind:this={canvas} style="aspect-ratio: {canvasWidth} / {canvasHeight}"></canvas>
    </div>
  </div>
</div>
