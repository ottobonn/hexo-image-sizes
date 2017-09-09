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
function profileNameToFileName(baseFileName, profileName) {
  let prefix = "";
  if (profileName) {
    prefix = profileName + "-";
  }
  return path.join(
    path.dirname(baseFileName),
    prefix + path.basename(baseFileName)
  );
}

/*
Given a weak configuration object and a strong one that should take precendence,
find the value of `weakPropertyName`, which might be called `strongPropertyName`
in the stong config if `strongPropertyName` is specified.
*/
function override(weakConfig, strongConfig, weakPropertyName, strongPropertyName=null) {
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
function factory (hexo) {
  return function imsizeTag (args, content) {
    let config = hexo.config.image_sizes;

    debug(args);
    debug(content);

    let doc;

    try {
      doc = yaml.safeLoad(content);
    } catch (err) {
      console.error(err);
      return;
    }

    let src = doc.src;
    let profileName = override(config, doc, "defaultProfile", "profile");
    let alt = doc.alt;
    let useAltForTitle = config.useAltForTitle;
    let title = doc.title || (useAltForTitle && alt);
    let shouldLink = override(config, doc, "link");
    let linkProfile = override(config, doc, "linkProfile");

    profileName = resolveProfileName(config, profileName);
    let profileSrc = profileNameToFileName(src, profileName);
    console.log(profileName, profileSrc)
    // Add this image to the db so we will create it later
    let db = hexo.locals.get("image_sizes_db");
    db.push({
      inputPath: src,
      outputPath: profileSrc,
      profile: profileName
    });

    let attrs = {
      src: profileSrc,
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
      let href = profileNameToFileName(src, linkProfile);
      db.push({
        inputPath: src,
        outputPath: href,
        profile: linkProfile
      });
      html = `<a href="${href}">${html}</a>`;
    }

    return html;
  };
}

module.exports = factory;
