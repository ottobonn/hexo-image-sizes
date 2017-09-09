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

var profiles = hexo.config.image_sizes.profiles;
Object.keys(profiles).forEach(function registerImageProcessor(profileName) {
  var profile = profiles[profileName];
  debug(profileName, profile);
  var processor = new ImageSizesProcessor(hexo, profileName, {
    "width": profile.width,
    "height": profile.height,
    "allowEnlargement": profile.allowEnlargement
  });
  hexo.extend.processor.register(hexo.config.image_sizes.pattern, function (file) {
    processor.process(file);
  });
});

// Set up the "database" of image data (not used yet)
hexo.locals.set("image_sizes_db", [])

// Register the "imsize" tag. These tags interact with the image_sizes_db
hexo.extend.tag.register("imsize", imsizeTag, {ends: true});

hexo.extend.filter.register("after_generate", function() {
  debug(hexo.locals.get("image_sizes_db"));
});
