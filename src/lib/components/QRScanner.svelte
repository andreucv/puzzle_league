<script>
  import { onMount, createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher();

  export let isOpen = false;
  export let width = 300;
  export let height = 200;

  let QRScanner;
  let scanner;
  let cameras = [];
  let selectedCamera = null;
  let scannerError = '';
  let scanResult = '';

  const opts = {
    continuous: true,
    video: null,
    mirror: true,
    captureImage: false,
    backgroundScan: true,
    refractoryPeriod: 5000,
    scanPeriod: 1
  };

  onMount(async () => {
    if (typeof window !== 'undefined') {
      try {
        // Import the QR scanner dynamically for client-side only
        const module = await import('svelte-qr-scanner');
        QRScanner = module.default;
      } catch (error) {
        console.error('Failed to load QR scanner:', error);
        scannerError = 'QR Scanner not available';
      }
    }
  });

  function handleScan(event) {
    scanResult = event.detail;
    dispatch('scan', { content: scanResult });
    closeScanner();
  }

  function handleScannerStarted() {
    console.log('Scanner started');
    scannerError = '';
  }

  function handleScannerStopped() {
    console.log('Scanner stopped');
  }

  function handleScannerStartFailed(event) {
    console.error('Scanner start failed:', event.detail);
    scannerError = 'Failed to start camera';
  }

  function handleLoadCameraFailed(event) {
    console.error('Camera load failed:', event.detail);
    scannerError = 'Failed to load camera';
  }

  function closeScanner() {
    isOpen = false;
    if (scanner) {
      scanner.stop();
    }
  }

  function startScanner() {
    isOpen = true;
    scannerError = '';
    scanResult = '';
  }

  // Expose methods
  export { startScanner, closeScanner };
</script>

{#if isOpen}
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white p-6 rounded-lg max-w-md w-full mx-4">
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-lg font-semibold">Scan QR Code</h3>
        <button
          class="btn btn-sm btn-circle"
          on:click={closeScanner}
          aria-label="Close scanner"
        >
          ✕
        </button>
      </div>

      {#if scannerError}
        <div class="alert alert-error mb-4">
          <span>{scannerError}</span>
        </div>
      {/if}

      {#if QRScanner}
        <div class="scanner-container mb-4">
          <svelte:component
            this={QRScanner}
            {width}
            {height}
            {cameras}
            {opts}
            bind:this={scanner}
            on:scan={handleScan}
            on:scannerStarted={handleScannerStarted}
            on:scannerStopped={handleScannerStopped}
            on:scannerStartFailed={handleScannerStartFailed}
            on:loadCameraFailed={handleLoadCameraFailed}
          >
            <div class="placeholder text-center py-8 text-gray-500">
              No cameras loaded! Please allow camera access.
            </div>
          </svelte:component>
        </div>
      {:else}
        <div class="text-center py-8 text-gray-500">
          Loading QR scanner...
        </div>
      {/if}

      <div class="flex gap-2">
        <button class="btn btn-secondary flex-1" on:click={closeScanner}>
          Cancel
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  .scanner-container {
    display: flex;
    justify-content: center;
    align-items: center;
  }

  :global(.scanner-container video) {
    border-radius: 8px;
    max-width: 100%;
  }
</style>
