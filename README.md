# Introduction
The `exif-cli` tool allows you to extract geotags from JPEG and TIFF files. It returns a CSV that contains the file path, datetime when the picture was taken and the latitude, longitude, altitude information from their EXIF.

# Requirements

You require node.js and npm to be installed on your local machine to use this tool.

# Installation

Clone this repository:

`git clone git@github.com:Smart-Villages/exif-cli.git && cd exif-cli`

If you don't have git, you can also download the files directly from here: https://github.com/Smart-Villages/exif-cli/archive/master.zip

In the folder of the project, run:

`npm i -g .`

# Usage

## Extract data from all images in the current directory
Includes all sub-directories.

`exif-cli extract`

Example output:
```
Directory1,Filename,DateTime,Latitude,Longitude,Altitude
images,IMG_20200618_111954.jpg,2020:06:18 11:19:54,7.0154813527777777,13.72925186138889,1034.6
```

## Extract data from a directory `images`
Includes all sub-directories.

`exif-cli extract images`

Example output:
```
Directory1,Filename,DateTime,Latitude,Longitude,Altitude
images,IMG_20200618_111954.jpg,2020:06:18 11:19:54,7.0154813527777777,13.72925186138889,1034.6
```

## Extract data from a specific image

`exif-cli extract IMG_20200618_111954.jpg`

Example output:
```
Filename,DateTime,Latitude,Longitude,Altitude
IMG_20200618_111954.jpg,2020:06:18 11:19:54,7.0154813527777777,13.72925186138889,1034.6
```

## Use a custom separator
Default is comma `,`

`exif-cli extract IMG_20200618_111954.jpg --separator ;`

Example output:
```
Filename;DateTime;Latitude;Longitude;Altitude
IMG_20200618_111954.jpg;2020:06:18 11:19:54;7.0154813527777777;13.72925186138889;1034.6
```

## Exclude directory names

`exif-cli extract IMG_20200618_111954.jpg --no-directories`

Example output:
```
Filename,DateTime,Latitude,Longitude,Altitude
IMG_20200618_111954.jpg,2020:06:18 11:19:54,7.0154813527777777,13.72925186138889,1034.6
```
