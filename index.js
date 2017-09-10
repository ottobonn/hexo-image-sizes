/* global hexo */
var assign = require("object-assign");
var ImageSizesProcessor = require("./lib/ImageSizesProcessor");
var imsizeTag = require("./lib/imsize-tag")(hexo);
var debug = require("debug")("hexo:image_sizes");

hexo.config.image_sizes = assign({
  pattern: /\.(jpg|jpeg|png)$/i,
  profiles: []
}, hexo.config.image_sizes);

debug("Registering for files matching " + hexo.config.image_sizes.pattern);

let profiles = hexo.config.image_sizes.profiles;

hexo.locals.set("image_sizes_db", {
  updatedPaths: {}, // Files that have changed since Hexo last ran (map from relative path to full path)
  imagesToGenerate: {}, // Files the blog actually uses (map from profile type to file info)
});

hexo.extend.processor.register(hexo.config.image_sizes.pattern, function (file) {
  // Record which files need updating
  let updatedPaths = hexo.locals.get("image_sizes_db").updatedPaths;
  let verb = file.type;
  updatedPaths[file.path] = file;
  debug(`Observed ${verb} ${file.path}`);
});

// Register the "imsize" tag. These tags interact with the image_sizes_db
hexo.extend.tag.register("imsize", imsizeTag, {ends: true});

// Generate images the site uses in imsize tags
hexo.extend.filter.register("after_generate", function() {
  let db = hexo.locals.get("image_sizes_db");
  debug(db);
  let updatedPaths = db.updatedPaths;
  let imagesToGenerate = db.imagesToGenerate;
  Object.keys(imagesToGenerate).forEach((profileName) => {
    let profile = profiles[profileName];
    let processor = new ImageSizesProcessor(hexo, profileName, {
      "width": profile.width,
      "height": profile.height,
      "allowEnlargement": profile.allowEnlargement
    });
    let toGenerate = imagesToGenerate[profileName];
    toGenerate.forEach((fileInfo) => {
      let input = fileInfo.inputPath;
      let output = fileInfo.outputPath;
      let file = updatedPaths[input];
      if (!file) {
        debug(`Unknown file:\t${input}`);
        return; // This file was not updated recently
      }
      let fullPath = file.source;
      let verb = file.type;
      if (!(verb === "create" || verb === "update")) {
        debug(`Unchanged file:\t${input}`);
        return;
      }
      debug(`Generating "${profileName}" version of\t${input}`);
      processor.process({
        relativeInput: input,
        relativeOutput: output,
        fullInput: fullPath,
      });
    });
  })
});
