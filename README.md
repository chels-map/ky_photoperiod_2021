# Photoperiod per month in Kentucky

## Methods 
The point data in csv available for the creation of the map, with a column of total duration of daylength in minutes per day. Data was first processed using QGIS v3.22.1. A spatial join was perfomed from the point data on the 15th of each month onto a hex grid 100,000 feet on the hex's y-axis. The layer was exported into a geojson and then loaded onto a map. 

The color scale and color breaks were created using ColorBrewer. 

Two base maps are loaded under the slightly opaque photoperiod layer to show major road outlines at a low zoom level, and then to show topographic relief at a high zoom level. 

## Data Sources
The data was provided by Dr. Garrett Owen from the University of Kentucky. Data consist of city points with lat/long coordinates and an associated daylight duration at each location for every day of the year (data from 2020).

## Technology Stack 
- Photoperiod point layer averaged per hex of a hex grid occurred in QGIS
- The map web page created with the JS libraries Leaflet and Bootstrap
- Appropriate color scales and legends generated with the Chroma.js library's function ColorBrewer
- The map will be hosted on GitHub pages

[Map available HERE](https://chels-map.github.io/ky_photoperiod_2021/)
