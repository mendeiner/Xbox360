// Downscales an arbitrary image file to at most maxDim on its longest side (never upscales)
// and re-encodes as webp, keeping the original aspect ratio — used for feed photos, which
// unlike avatars aren't forced into a square crop.
export function resizeImageToWebp(file, maxDim = 1600, quality = 0.82) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const scale = Math.min(1, maxDim / Math.max(img.width, img.height))
      const width = Math.round(img.width * scale)
      const height = Math.round(img.height * scale)
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      canvas.getContext('2d').drawImage(img, 0, 0, width, height)
      canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('toBlob failed')), 'image/webp', quality)
      URL.revokeObjectURL(img.src)
    }
    img.onerror = reject
    img.src = URL.createObjectURL(file)
  })
}

// Crops an image to the pixel area react-easy-crop reports, then downsizes to a fixed
// square output so avatars stay small and consistent regardless of the source photo.
export function getCroppedImageBlob(imageSrc, cropPixels, outputSize = 512) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = outputSize
      canvas.height = outputSize
      const ctx = canvas.getContext('2d')
      ctx.drawImage(
        img,
        cropPixels.x, cropPixels.y, cropPixels.width, cropPixels.height,
        0, 0, outputSize, outputSize
      )
      canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('toBlob failed')), 'image/webp', 0.9)
    }
    img.onerror = reject
    img.src = imageSrc
  })
}
