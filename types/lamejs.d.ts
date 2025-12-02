declare module 'lamejs' {
  export class Mp3Encoder {
    constructor(channels: number, samplerate: number, kbps: number);
    encodeBuffer(left: Int16Array, right?: Int16Array): Int8Array;
    flush(): Int8Array;
  }
}

// Definição global para quando carregado via CDN
interface Window {
  lamejs?: {
    Mp3Encoder: {
      new (channels: number, samplerate: number, kbps: number): {
        encodeBuffer(left: Int16Array, right?: Int16Array): Int8Array;
        flush(): Int8Array;
      };
    };
  };
}
