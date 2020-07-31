let debug = require("debug")("hexo:image_sizes");

/**
 * Convert a string (a file path) to a file path that uses backslashes
 */
function pathToBackslashPath(pathString) {
  return pathString.split('\\').join('/');
};

/**
 * Switch the slashes in case we get Windows-style paths.
 */
function pathSwapSlashes(str) {
  let delim = '/';
  let newDelim = '\\';
  if (str.split(delim).length <= 1)
  {
    delim = '\\';
    newDelim = '/';
  }

  if (str.split(delim).length <= 1)
  {
    return str;
  }
  else
  {
    return str.split(delim).join(newDelim);
  }
}

/**
 * Shift the private directory out from the front of the path.  Given a
 * relative input path, remove leading directory in the path if it includes an
 * underscore
 *
 * Example:
 *    input: _posts/test1/image.jpg
 *   return: test1/image.jpg
 */
function pathShiftPrivateDirectory(inputPath) {
  let delim = '/';
  let array = inputPath.split(delim);
  if (array.length > 1) {
  }
  else
  {
    delim = '\\';
    array = inputPath.split(delim);
  }

  if (array.length > 1) {
    if ('_' === array[0].charAt(0)) {
      array.shift();
      return array.join(delim);
    }
  }
  return inputPath;
};

let functions = {
  pathToBackslashPath,
  pathSwapSlashes,
  pathShiftPrivateDirectory,
};

module.exports = functions;
