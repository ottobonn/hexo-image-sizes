let sharp = require("sharp");
let debug = require("debug")("hexo:image_sizes");
let streamToArray = require("stream-to-array");

var ImageResizer = function (hexo, name, options) {
  this.hexo = hexo;
  this.name = name;
  this.options = options;
  debug(name + " processor constructed");
};

/*
Resize the image from the stream at "originalRouteName" and write it to
"resizedRouteName"
*/
ImageResizer.prototype.resizeRoute = function ({ originalRouteName, resizedRouteName, metaData}) {
  const formatedOriginalRouteName = originalRouteName.replace('_posts', metaData);
  const formatedResizedRouteName = resizedRouteName.replace('_posts', metaData);

  let width = this.options.width;
  let height = this.options.height;
  let allowEnlargement = this.options.allowEnlargement;

  const inputStream = this.hexo.route.get(formatedOriginalRouteName);
  if (!inputStream) {
    debug("Failed to find input stream for route", {formatedOriginalRouteName});
    return;
  }

  return streamToArray(inputStream).then(function (parts) {
    const buffers = [];
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      buffers.push((part instanceof Buffer) ? part : new Buffer(part));
    }
    return Buffer.concat(buffers);
  }).then(buffer => {
    let resizer = sharp(buffer).resize(width, height);
    if (!allowEnlargement) {
      resizer.withoutEnlargement();
    }
    const resizedPromise = resizer.toBuffer();
    return this.hexo.route.set(formatedResizedRouteName, () => resizedPromise);
  });
};

module.exports = ImageResizer;
