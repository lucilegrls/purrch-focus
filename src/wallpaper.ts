/** Inline local image layers so the exported SVG is self-contained inside an Image. */
export async function exportableSvg(source: Element): Promise<string> {
  const clone = source.cloneNode(true) as SVGElement;
  for (const img of Array.from(clone.querySelectorAll("image"))) {
    const href = img.getAttribute("href");
    if (!href || href.startsWith("data:")) continue;
    const response = await fetch(href);
    if (!response.ok) throw Error("Room asset unavailable");
    const blob = await response.blob();
    const data = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
    img.setAttribute("href", data);
  }
  return new XMLSerializer().serializeToString(clone);
}
