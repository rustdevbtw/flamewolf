#!/bin/sh

src="$1"

mkdir -p icons
pwd=$(pwd)

for size in 16 22 24 32 48 64 128 256 512 1024; do
  # App Icon
  file=${1%.*}-icon_$size.png
  output="icons/$file"
  printf "[App Icon] Generating $output\n"
  inkscape -o $output -w $size -h $size $src
  # Now, default* icons
  file=default$size.png
  output=$file
  printf "[Internal Icon] Generating $output\n"
  inkscape -o $output -w $size -h $size $src
done
