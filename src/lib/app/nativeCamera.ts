/**
 * SPEC-045 §4.5: Wandfoto mit der Kamera des Handys (nur App).
 * Lange Seite höchstens 2400 px, JPEG-Qualität 85 %, Ausrichtung wie fotografiert (Querformat bleibt quer).
 * Kamera oder Galerie fragt das System. Erlaubnis erst beim Tippen.
 */
export const WALL_PHOTO_MAX_PX = 2400;
export const WALL_PHOTO_QUALITY = 85;

export async function takeWallPhoto(): Promise<string | null> {
  const { Camera, CameraResultType, CameraSource } = await import('@capacitor/camera');
  try {
    const photo = await Camera.getPhoto({
      source: CameraSource.Prompt,
      resultType: CameraResultType.DataUrl,
      quality: WALL_PHOTO_QUALITY,
      width: WALL_PHOTO_MAX_PX,
      height: WALL_PHOTO_MAX_PX,
      correctOrientation: true,
      saveToGallery: false,
      promptLabelHeader: 'Wandfoto',
      promptLabelPhoto: 'Aus der Galerie',
      promptLabelPicture: 'Foto machen',
      promptLabelCancel: 'Abbrechen',
    });
    return photo.dataUrl ?? null;
  } catch (err) {
    if (/cancel/i.test(String((err as any)?.message ?? err))) return null;
    throw err;
  }
}
