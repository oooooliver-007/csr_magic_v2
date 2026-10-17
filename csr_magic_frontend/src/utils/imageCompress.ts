/**
 * 图片压缩工具（上传前处理）
 *
 * 背景：封面图以 base64 data URL 内联进 JSON 提交，若直接上传原始手机照片，
 * 单请求体可达 6MB+，超过反代/后端可接受体积，表现为"上传没反应"。
 * 这里在上传前把长边缩到上限并重新编码为 JPEG，保证请求体可控。
 */

export type ImageCompressErrorCode = 'UNSUPPORTED_TYPE' | 'DECODE_FAILED' | 'TOO_LARGE';

export class ImageCompressError extends Error {
  readonly code: ImageCompressErrorCode;

  constructor(code: ImageCompressErrorCode, message: string) {
    super(message);
    this.name = 'ImageCompressError';
    this.code = code;
  }
}

export interface CompressImageOptions {
  /** 长边像素上限，默认 1600 */
  maxEdge?: number;
  /** 压缩后 data URL 允许的最大字节数，默认 400KB */
  maxBytes?: number;
  /** 初始 JPEG 质量，默认 0.82 */
  quality?: number;
  /** 质量下限，低于该质量仍超限则报错，默认 0.4 */
  minQuality?: number;
  /** 原文件体积上限（不压缩直接拒绝），默认 20MB */
  maxSourceBytes?: number;
}

export interface CompressedImage {
  dataUrl: string;
  bytes: number;
  width: number;
  height: number;
}

const DEFAULTS: Required<CompressImageOptions> = {
  maxEdge: 1600,
  maxBytes: 400 * 1024,
  quality: 0.82,
  minQuality: 0.4,
  maxSourceBytes: 20 * 1024 * 1024,
};

/** data URL 的实际二进制体积（base64 解码后） */
export function dataUrlBytes(dataUrl: string): number {
  const commaIndex = dataUrl.indexOf(',');
  const base64 = commaIndex >= 0 ? dataUrl.slice(commaIndex + 1) : dataUrl;
  const padding = base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0;
  return Math.floor((base64.length * 3) / 4) - padding;
}

interface LoadedImage {
  source: CanvasImageSource;
  width: number;
  height: number;
  release: () => void;
}

async function loadImage(file: File): Promise<LoadedImage> {
  if (typeof createImageBitmap === 'function') {
    try {
      const bitmap = await createImageBitmap(file);
      return {
        source: bitmap,
        width: bitmap.width,
        height: bitmap.height,
        release: () => bitmap.close(),
      };
    } catch {
      // 某些浏览器/格式不支持 createImageBitmap，回退到 <img>
    }
  }

  return new Promise<LoadedImage>((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      resolve({
        source: img,
        width: img.naturalWidth,
        height: img.naturalHeight,
        release: () => URL.revokeObjectURL(url),
      });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new ImageCompressError('DECODE_FAILED', '图片解析失败，请换一张图片重试'));
    };
    img.src = url;
  });
}

export async function compressImage(
  file: File,
  options: CompressImageOptions = {},
): Promise<CompressedImage> {
  const opts = { ...DEFAULTS, ...options };

  if (!file.type.startsWith('image/')) {
    throw new ImageCompressError('UNSUPPORTED_TYPE', '请选择 JPG / PNG 等图片文件');
  }
  if (file.size > opts.maxSourceBytes) {
    const limitMb = Math.round(opts.maxSourceBytes / 1024 / 1024);
    throw new ImageCompressError('TOO_LARGE', `图片超过 ${limitMb}MB，请先裁剪或压缩后再上传`);
  }

  const { source, width, height, release } = await loadImage(file);

  try {
    const scale = Math.min(1, opts.maxEdge / Math.max(width, height));
    const targetWidth = Math.max(1, Math.round(width * scale));
    const targetHeight = Math.max(1, Math.round(height * scale));

    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new ImageCompressError('DECODE_FAILED', '当前浏览器不支持图片压缩');
    }

    // JPEG 不支持透明通道，先铺白底，避免 PNG 透明区域变黑
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, targetWidth, targetHeight);
    ctx.drawImage(source, 0, 0, targetWidth, targetHeight);

    let quality = opts.quality;
    let dataUrl = canvas.toDataURL('image/jpeg', quality);
    while (dataUrlBytes(dataUrl) > opts.maxBytes && quality > opts.minQuality) {
      quality = Math.max(opts.minQuality, Number((quality - 0.12).toFixed(2)));
      dataUrl = canvas.toDataURL('image/jpeg', quality);
    }

    const bytes = dataUrlBytes(dataUrl);
    if (bytes > opts.maxBytes) {
      const limitKb = Math.round(opts.maxBytes / 1024);
      throw new ImageCompressError('TOO_LARGE', `图片压缩后仍超过 ${limitKb}KB，请换一张尺寸更小的图片`);
    }

    return { dataUrl, bytes, width: targetWidth, height: targetHeight };
  } finally {
    release();
  }
}
