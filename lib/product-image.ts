export function productImageSrc(image: string) {
  return image.startsWith('http://') || image.startsWith('https://') || image.startsWith('/')
    ? image
    : `/products/${image}`;
}
