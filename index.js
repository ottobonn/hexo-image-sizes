/* global hexo */
var assign = require("object-assign");
var ImageResizer = require("./lib/ImageResizer");
var imsizeTag = require("./lib/imsize-tag")(hexo);
var debug = require("debug")("hexo:image_sizes");
var Utility = require("./lib/Utility");

hexo.config.image_sizes = assign({
  pattern: /\.(jpg|jpeg|png)$/i,
  profiles: []
}, hexo.config.image_sizes);

debug("Registering for files matching " + hexo.config.image_sizes.pattern);

let profiles = hexo.config.image_sizes.profiles;

hexo.locals.set("image_sizes_db", {
  updatedPaths: {}, // Files that have changed since Hexo last ran (map from absolute path to Hexo file object)
  imagesToGenerate: {}, // Files the blog actually uses (map from profile type to file info from imsizeTag)
});

// Observe Hexo file activity and record which files are updated
// Each file object is a Hexo file (https://hexo.io/api/box.html)
hexo.extend.processor.register(hexo.config.image_sizes.pattern, function (file) {
  let updatedPaths = hexo.locals.get("image_sizes_db").updatedPaths;
  let verb = file.type;
  let hexoRelativeInput = file.path;
  updatedPaths[hexoRelativeInput] = file;
  debug(`Observed ${verb} ${hexoRelativeInput}`);
});

// Register the "imsize" tag. These tags interact with the image_sizes_db to
// record when a post uses an image and embed the image in the post.
hexo.extend.tag.register("imsize", imsizeTag, {ends: true});

// Generate images the site has used in imsize tags
hexo.extend.filter.register("after_generate", function() {
  let db = hexo.locals.get("image_sizes_db");
  debug(JSON.stringify(db, null, 2));

  let updatedPaths = db.updatedPaths;
  let imagesToGenerate = db.imagesToGenerate;

  let profilesGenerated = Object.keys(imagesToGenerate).map((profileName) => {

    let profile = profiles[profileName];
    let resizer = new ImageResizer(hexo, profileName, {
      "width": profile.width,
      "height": profile.height,
      "allowEnlargement": profile.allowEnlargement,
      "disableRotation": profile.disableRotation
    });

    let toGenerate = imagesToGenerate[profileName];
    let imagesInProfileGenerated = toGenerate.map((fileInfo) => {
      let {hexoRelativeInput, hexoRelativeOutput} = fileInfo;

      // TODO factor out this check for verb:
      let file = updatedPaths[hexoRelativeInput];
      if (!file) {
        hexoRelativeInput = Utility.pathToBackslashPath(hexoRelativeInput);
        file = updatedPaths[hexoRelativeInput];
      }

      if (!file) {
        debug(`Unknown file:\t${hexoRelativeInput}`);
        return;
      }
      let verb = file.type;
      if (!(verb === "create" || verb === "update")) {
        debug(`Unchanged file:\t${hexoRelativeInput}`);
        return;
      }

      debug("Resizing image\n", {
        hexoRelativeInput,
        hexoRelativeOutput,
        profileName,
      });

      return resizer.resizeRoute({
        originalRouteName: hexoRelativeInput,
        resizedRouteName: hexoRelativeOutput,
      });

    });

    return Promise.all(imagesInProfileGenerated);
  });

  // Return undefined to leave original file data unmodified
  return Promise.all(profilesGenerated).then(() => undefined);
});
