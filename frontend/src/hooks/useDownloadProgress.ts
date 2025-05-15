import { useState, useEffect } from 'react';

interface DownloadProgress {
  progress: number;
  loaded: number;
  total: number;
  data: {
    text: () => string | null;
    blob: (mimeType?: string) => Blob | null;
    base64: () => string | null;
    dataUrl: (mimeType?: string) => string | null;
    raw: () => Uint8Array | null;
  };
  error: Error | null;
  status: 'idle' | 'loading' | 'success' | 'error';
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
}

/**
 * A custom React hook to track progress of file downloads
 * @param url - The URL to download
 * @param options - Optional fetch options
 * @returns Download status information
 */
const useDownloadProgress = (
  url: string | null | undefined,
  options: RequestInit = {}
): DownloadProgress => {
  const [progress, setProgress] = useState<number>(0);
  const [loaded, setLoaded] = useState<number>(0);
  const [total, setTotal] = useState<number>(0);
  const [data, setData] = useState<Uint8Array | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  useEffect(() => {
    if (!url) return;

    const controller = new AbortController();
    const signal = controller.signal;

    const fetchData = async (): Promise<void> => {
      try {
        setStatus('loading');
        setProgress(0);
        setLoaded(0);
        setTotal(0);
        setError(null);

        // Start the fetch with the abort signal
        const response = await fetch(url, { ...options, signal });

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        // Get total size from Content-Length header if available
        const contentLength = response.headers.get('content-length');
        const totalSize = contentLength ? parseInt(contentLength, 10) : 0;
        setTotal(totalSize);

        // Get the ReadableStream from the response body
        const reader = response.body?.getReader();

        if (!reader) {
          throw new Error('ReadableStream not supported');
        }

        const chunks: Uint8Array[] = [];
        let receivedLength = 0;

        // Process the data as it comes in
        // eslint-disable-next-line no-constant-condition
        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            break;
          }

          chunks.push(value);
          receivedLength += value.length;

          // Update progress
          setLoaded(receivedLength);
          if (totalSize) {
            setProgress(Math.round((receivedLength / totalSize) * 100));
          }
        }

        // Concatenate the chunks into a single Uint8Array
        const chunksAll = new Uint8Array(receivedLength);
        let position = 0;
        for (const chunk of chunks) {
          chunksAll.set(chunk, position);
          position += chunk.length;
        }

        setData(chunksAll);
        setProgress(100);
        setStatus('success');
      } catch (err) {
        const error = err as Error;
        if (error.name === 'AbortError') {
          setStatus('idle');
        } else {
          setError(error);
          setStatus('error');
        }
      }
    };

    fetchData();

    // Cleanup function to abort fetch on unmount
    return () => {
      controller.abort();
    };
  }, [url, options]);

  // Functions to convert the binary data to different formats
  const getDataAs = {
    // Get as text (UTF-8)
    text: (): string | null =>
      data ? new TextDecoder().decode(data) : null,

    // Get as blob with specified mime type
    blob: (mimeType = 'application/octet-stream'): Blob | null =>
      data ? new Blob([data], { type: mimeType }) : null,

    // Get as base64 encoded string
    base64: (): string | null => {
      if (!data) return null;

      let binary = '';
      const bytes = new Uint8Array(data);
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      return btoa(binary);
    },

    // Get as data URL for images
    dataUrl: (mimeType = 'application/octet-stream'): string | null => {
      if (!data) return null;
      const blob = new Blob([data], { type: mimeType });
      return URL.createObjectURL(blob);
    },

    // Get raw binary data
    raw: (): Uint8Array | null => data
  };

  return {
    progress,
    loaded,
    total,
    data: getDataAs,
    error,
    status,
    isLoading: status === 'loading',
    isSuccess: status === 'success',
    isError: status === 'error'
  };
};

export default useDownloadProgress;
