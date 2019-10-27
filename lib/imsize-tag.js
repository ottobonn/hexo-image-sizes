let path = require("path");
let debug = require("debug")("hexo:image_sizes");
let yaml = require("js-yaml");
let hexoUtil = require("hexo-util");

/*
Try to find the given profile `name` in `profiles` to make sure it exists. If
found, return `name`, indicating that it's a valid name. If it isn't a valid
name (or is falsy), try to find the default profile name, and return it if it's
in `profiles`. If that fails, return null, indicating that no profile name
applies to this image.
*/
function resolveProfileName(config, name) {
  if (!name) {
    return null;
  }
  let profiles = config.profiles;
  if (name && profiles[name]) {
    return name;
  }
  let defaultProfileName = config.defaultProfile;
  if (defaultProfileName && profiles[defaultProfileName]) {
    return defaultProfileName;
  }
  console.error(`hexo-image-sizes found no profile matching ${profileName} and no default profile.`);
  return null;
}

/*
Given a profile name, return the filename for images in that profile, or the
original filename if the profile name is falsy.
*/
function absoluteOutputPath(absoluteInput, profileName, absoluteHexoSourceDirectory, absoluteHexoPublicDirectory) {
  let prefix = "";
  if (profileName) {
    prefix = profileName + "-";
  }
  const baseName = path.basename(absoluteInput);
  const relativeInput = path.relative(absoluteHexoSourceDirectory, absoluteInput);
  const result = path.join(
    absoluteHexoPublicDirectory,
    path.dirname(relativeInput),
    prefix + baseName
  );
  return result;
}

/*
Given a weak configuration object and a strong one that should take precendence,
find the value of `weakPropertyName`, which might be called `strongPropertyName`
in the stong config if `strongPropertyName` is specified.
*/
function override(weakConfig, strongConfig, weakPropertyName, strongPropertyName = null) {
  strongPropertyName = strongPropertyName || weakPropertyName;
  if (strongConfig.hasOwnProperty(strongPropertyName)) {
    return strongConfig[strongPropertyName];
  }
  return weakConfig[weakPropertyName];
}

/*
This function takes in a reference to the hexo object and returns a function to
interpret imsize tags. The Hexo Tag API is documented at
https://hexo.io/api/tag.html.
*/
function factory(hexo) {
  /*
  Add the given fileInfo to the profileName in the imagesToGenerate database.
  */
  function addImageToGenerate(profileName, fileInfo) {
    if (!profileName) {
      debug("imsize tag using unmodified original", fileInfo);
      return; // If profileName is falsy, this is the original image; do nothing
    }
    let db = hexo.locals.get("image_sizes_db").imagesToGenerate;
    if (!db[profileName]) {
      db[profileName] = [];
    }
    db[profileName].push(fileInfo);
    debug(`imsize tag using ${profileName}`, fileInfo);
  }

  return function imsizeTag(args, content) {
    const tagContext = this;
    const absolutPathToContainingPost = tagContext.full_source;
    const absolutePathToPostDirectory = path.dirname(absolutPathToContainingPost);
    const absolutePathToPostAssetDirectory = tagContext.asset_dir;
    const isPost = tagContext.layout === "post";
    const hexoSourceDir = path.resolve(hexo.source_dir);
    const hexoPublicDir = path.resolve(hexo.public_dir);

    let config = hexo.config.image_sizes;
    let doc;
    try {
      doc = yaml.safeLoad(content);
    } catch (err) {
      console.error(err);
      return;
    }
    let src = doc.src;
    let absoluteInput;
    const blogRoot = config.blogRoot;

    // Turn src into an absolute path
    if (path.isAbsolute(src)) {
      // Absolute paths reference the Hexo base path
      absoluteInput = path.join(hexoSourceDir, src);
    } else {
      if (hexo.config.post_asset_folder && isPost) {
        // Relative paths refer to the post's asset directory
        const absolutePathToOutputPostAssetDirectory = absolutePathToPostAssetDirectory.replace('_posts', doc.blogDate);

        absoluteInput = path.join(absolutePathToOutputPostAssetDirectory, src);
        rawAbsoluteInput = path.join(absolutePathToPostAssetDirectory, src);
      } else {
        // Relative paths refer to the post's containing directory
        absoluteInput = path.join(absolutePathToPostDirectory, src);
      }
    }

    const hexoRelativeInput = path.relative(hexoSourceDir, absoluteInput);
    const rawHexoRelativeInput = path.relative(hexoSourceDir, rawAbsoluteInput);
    let profileName = override(config, doc, "defaultProfile", "profile");
    let alt = doc.alt;
    let useAltForTitle = config.useAltForTitle;
    let title = doc.title || (useAltForTitle && alt);
    let shouldLink = override(config, doc, "link");
    let linkProfile = override(config, doc, "linkProfile");
    profileName = resolveProfileName(config, profileName);
    let absoluteResizedImagePath = absoluteOutputPath(absoluteInput, profileName, hexoSourceDir, hexoPublicDir);
    let hexoRelativeResizedImagePath = path.relative(hexoPublicDir, absoluteResizedImagePath);

    // Add this image to the db so we will create it later
    addImageToGenerate(profileName, {
      hexoRelativeInput,
      hexoRelativeOutput: hexoRelativeResizedImagePath,
      rawHexoRelativeInput,
      metaData:doc.blogDate,
    });

    let attrs = {
      src: `${blogRoot}${hexoRelativeResizedImagePath}`,
    };

    // Add optional properties
    if (alt) {
      attrs.alt = alt;
    }
    if (title) {
      attrs.title = title;
    }

    let html = hexoUtil.htmlTag("img", attrs);

    if (shouldLink) {
      linkProfile = resolveProfileName(config, linkProfile);
      let absoluteLinkTargetImagePath = absoluteOutputPath(absoluteInput, linkProfile, hexoSourceDir, hexoPublicDir);
      let hexoRelativeLinkTargetImagePath = path.relative(hexoPublicDir, absoluteLinkTargetImagePath);
      addImageToGenerate(linkProfile, {
        hexoRelativeInput,
        hexoRelativeOutput: hexoRelativeLinkTargetImagePath,
        metaData: doc.blogDate,
        rawHexoRelativeInput,
      });
      html = `<a href="${blogRoot}${hexoRelativeLinkTargetImagePath}">${html}</a>`;
    }

    return html;
  };
}

module.exports = factory;
