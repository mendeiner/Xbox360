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
