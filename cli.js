#!/usr/bin/env node

const exif = require("jpeg-exif");
const { program } = require("commander");
const fs = require("fs");

program
    .version('1.0.0');

/**
 * Escape the given separator by adding a backslash in front of it.
 *
 * @param {string} value The value to escape.
 * @param {string} separator The separator used in the CSV export that should be escaped.
 * @return {string} The escaped value.
 */
const escape = (value, separator) => {
  if(typeof value!=='string') {
    value = value.toString();
  }

  return value.split(separator).join(`\\${separator}`);
};

/**
 * Return an array of the given length that either returns empty strings or the given value.
 *
 * @param {number} length The length of the returned array
 * @param {string} value? Optional value to fill the array with. You can use "[index]" to be replaced with the index in
 *                        the array, starting at 1.
 * @return {string[]}
 */
const fill = (length, value) => {
  if(!value) {
    value = '';
  }

  return Array.apply(null, Array(length))
      .map((s,i) => value.replace('[index]', (i+1).toString()));
};

program
    .command('extract [path]')
    .option('-s, --separator <separator>', 'Separator like , or ;', ',')
    .option('--no-directories', "Don't include the full file path and only add the filename to the output.")
    .description('Extract the EXIF information from the given directory or file. If a directory is given, all files in that directory and all sub-directories will be parsed. Defaults to the current working directory.')
    .action(async (source, cmdObj) => {
      const {separator, directories} = cmdObj;

      if(!source) {
        source = '.';
      }
      else if(source.charAt(source.length-1)==='/') {
        source = source.substr(0, source.length-1);
      }

      const files = [];

      const rootStats = fs.statSync(source);

      /**
       * Scan the file at the given path. Returns the object returned from the exif library plus an additional `path`
       * property that is an array consisting of all path directories and the filename. Doesn't include the "." if one
       * is given in the path.
       *
       * Fills the files array above.
       *
       * @param {string} path
       * @return {Promise<void>}
       */
      const scanFile = (path) => {
        return new Promise((resolve, reject) => {
          exif.parse(path, (err, data) => {
            if(err) {
              reject(err);
              return;
            }

            data.path = path.split('/');
            if(data.path[0]==='.') {
              data.path = data.path.slice(1);
            }

            files.push(data);

            resolve();
          });
        });
      };

      /**
       * Scan the given directory recursively for all JPEG and TIFF files and call `scanFile` above.
       *
       * @param {string} path
       * @return {Promise<void>}
       */
      const scanDirectory = (path) => {
        return new Promise((resolve, reject) => {
          fs.readdir(path, {withFileTypes:true}, (err, files) => {
            if(err) {
              reject(err);
              return;
            }

            Promise.all(files.map(async (entry) => {
              const entryPath = `${path}/${entry.name}`;

              if(entry.isDirectory()) {
                await scanDirectory(entryPath)
              }
              else {
                const fileType = entry.name.split('.').slice(-1)[0];
                if(['jpg','jpeg','tif','tiff'].includes(fileType)) {
                  await scanFile(entryPath);
                }
                else {
                  //console.error(`Ignoring ${entryPath} as it's neither a JPEG nor a TIFF file.`);
                }
              }
            })).then(resolve).catch(reject);
          });
        });
      };

      if(rootStats.isDirectory()) {
        await scanDirectory(source);
      }
      else {
        await scanFile(source);
      }

      const depth = files.reduce((a, b) => a.path.length>b.path.length ? a : b).path.length;

      /**
       * Create the CSV data based on the exif data objects from above.
       *
       * @type {string[]}
       */
      const data = files.map((entry) => {
        let gps;
        if(entry.GPSInfo) {
          if(entry.GPSInfo.GPSLatitudeRef!=='N') {
            throw new Error(`File ${entry.path.join('/')} uses unknown latitude reference ${entry.GPSInfo.GPSLatitudeRef}.`);
          }
          if(entry.GPSInfo.GPSLongitudeRef!=='E') {
            throw new Error(`File ${entry.path.join('/')} uses unknown longitude reference ${entry.GPSInfo.GPSLatitudeRef}.`);
          }
          gps = [
            entry.GPSInfo.GPSLatitude[0] +
            (entry.GPSInfo.GPSLatitude[1] ? entry.GPSInfo.GPSLatitude[1] / 60 : 0) +
            (entry.GPSInfo.GPSLatitude[2] ? entry.GPSInfo.GPSLatitude[2] / 3600 : 0),
            entry.GPSInfo.GPSLongitude[0] +
            (entry.GPSInfo.GPSLongitude[1] ? entry.GPSInfo.GPSLongitude[1] / 60 : 0) +
            (entry.GPSInfo.GPSLongitude[2] ? entry.GPSInfo.GPSLongitude[2] / 3600 : 0),
            entry.GPSInfo.GPSAltitude||0 - entry.GPSInfo.GPSAltitudeRef||0,
          ];
        }
        else {
          gps = fill(3);
        }

        const directoryNames = directories ? entry.path.slice(0, entry.path.length-1).map(value => escape(value,separator)).concat(fill(depth-entry.path.length)) : [];

        return [
            ...directoryNames,
            escape(entry.path.slice(-1)[0], separator),
            escape(entry.DateTime, separator),
            ...gps.map(value => escape(value,separator)),
        ].join(separator);
      });

      const directoryNames = directories ? fill(depth-1, 'Directory[index]') : [];

      const headers = [
          ...directoryNames,
          'Filename',
          'DateTime',
          'Latitude',
          'Longitude',
          'Altitude',
      ];

      console.log(`${headers.join(separator)}\n${data.join("\n")}`);
    });

program
    .parse(process.argv);
