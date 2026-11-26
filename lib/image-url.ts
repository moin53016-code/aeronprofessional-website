// NORMALIZE PUBLIC IMAGE URLS

export function normalizeImageUrl(
  input: string
): string {
  const value = input.trim();

  if (!value || value.length > 2048) {
    return '';
  }

  // EXISTING LOCAL IMAGES

  if (
    /^\/(?:uploads|images)\/[a-zA-Z0-9._-]+$/.test(value)
  ) {
    const filename = value.split('/').pop();

    if (filename === '.' || filename === '..') {
      return '';
    }

    return value;
  }

  try {
    const url = new URL(value);

    // ALLOW SECURE PUBLIC IMAGE URLS

    if (
      url.protocol !== 'https:' ||
      !url.hostname ||
      url.username ||
      url.password
    ) {
      return '';
    }

    // GOOGLE DRIVE SHARE LINK CONVERSION

    if (url.hostname === 'drive.google.com') {
      const pathMatch = url.pathname.match(
        /\/file\/d\/([a-zA-Z0-9_-]+)/
      );

      const queryId = [
        '/open',
        '/uc',
        '/thumbnail',
      ].includes(url.pathname)
        ? url.searchParams.get('id')
        : null;

      const fileId = pathMatch?.[1] ?? queryId;

      if (
        fileId &&
        /^[a-zA-Z0-9_-]+$/.test(fileId)
      ) {
        const imageUrl = new URL(
          'https://drive.google.com/thumbnail'
        );

        imageUrl.searchParams.set('id', fileId);
        imageUrl.searchParams.set('sz', 'w1600');

        const resourceKey =
          url.searchParams.get('resourcekey');

        if (resourceKey) {
          imageUrl.searchParams.set(
            'resourcekey',
            resourceKey
          );
        }

        return imageUrl.toString();
      }
    }

    // DROPBOX SHARED FILE CONVERSION

    if (
      url.hostname === 'www.dropbox.com' ||
      url.hostname === 'dropbox.com'
    ) {
      url.searchParams.delete('dl');
      url.searchParams.set('raw', '1');

      return url.toString();
    }

    // DIRECT IMAGE URLS
    // CLOUDINARY, IMAGEKIT, CDN AND OTHER HOSTS

    return value;

  } catch {
    return '';
  }
}