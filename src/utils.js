function loadIcon(name) {
  return require(`./assets/icons/PNG/${name}.png`);
}

function tryLoad(...icons) {
  try {
    return icons.map(loadIcon);
  } catch {
    return undefined;
  }
}

function tryLoadSet(role) {
  return (
    tryLoad(role, `Alternate/${role}`) ??
    tryLoad(role, `Alternate/${role}_g`, `Alternate/${role}_e`) ??
    tryLoad(role)
  );
}

function imagesForRole(role) {
  return (
    tryLoadSet(role.id) ??
    tryLoadSet(role.team) ??
    require("./assets/custom.png")
  );
}

function setupRole(role) {
  if (typeof role === "string") return setupRole({ id: role });

  if (role.image) {
    role.customImages = Array.isArray(role.image) ? role.image : [role.image];
    delete role.image;
  }

  role.images = imagesForRole(role);

  return role;
}

function resolveImages(role, grimoire) {
  const images =
    role.customImages && grimoire.isImageOptIn
      ? role.customImages
      : role.images;
  return Array.isArray(images) ? images : [images];
}

function getAlignmentCount(role, grimoire) {
  return resolveImages(role, grimoire).length;
}

function imageForRole(role, grimoire) {
  console.log(`resolving image for role ${role.id}`, role);
  const images = resolveImages(role, grimoire);
  // TODO: Dynamically invert the image if there is only one!
  return images[role.alignment ?? 0];
}

export { getAlignmentCount, imageForRole, setupRole };
