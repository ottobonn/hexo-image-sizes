var path = require("path");
var debug = require("debug")("hexo:image_sizes");
var yaml = require("js-yaml");
var hexoUtil = require("hexo-util");

/*
  Find a profile in the given `profiles` object, whose keys are the profile names.
*/
function findProfile(profiles, name) {
  return Object.keys(profiles).find(function (profileName) {
    return profileName === name;
  });
}

/*
Try to find a profile in `profiles` with the given `profileName`. If none
exists, try to find the default profile. If that fails, return null.
*/
function resolveProfileName(config, name) {
  var profiles = config.profiles;
  var profile = findProfile(profiles, name);
  if (profile) {
    return profile;
  }
  var defaultProfile = config.defaultProfile;
  if (defaultProfile) {
    profile = findProfile(profiles, defaultProfile);
  }
  if (profile) {
    return profile;
  }
  return null;
}

/*
This function takes in a reference to the hexo object and returns a function to
interpret imsize tags. The Hexo Tag API is documented at
https://hexo.io/api/tag.html.
*/
function factory (hexo) {
  return function imsizeTag (args, content) {
    var config = hexo.config.image_sizes;

    try {
      var doc = yaml.safeLoad(content);
    } catch (err) {
      console.error(err);
      return;
    }

    var src = doc.src;
    var profileName = doc.profile;
    var alt = doc.alt;

    var profileMatch = resolveProfileName(config, profileName);
    if (!profileMatch) {
      console.error(`hexo-image-sizes found no profile matching ${profileName} and no default profile.`);
    }

    // Even if there is no matching profile, continue. Default to using the
    // full-size image.

    var profilePrefix = "";
    if (profileMatch) {
      profilePrefix = profileMatch + "-";
    }

    // Prefix the image name wih the profile name
    var newSrc = path.join(
      path.dirname(src),
      profilePrefix + path.basename(src)
    );

    var attrs = {
      "src": newSrc
    };

    // If the user added alt-text, add it to the img tag. Avoid adding an empty
    // alt property.
    if (alt) {
      attrs.alt = alt;
    }

    return hexoUtil.htmlTag("img", attrs);
  };
}

module.exports = factory;
