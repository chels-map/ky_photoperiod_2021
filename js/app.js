(function (){
    // map options
    const options = {
      center: [37, -85.5],
      zoom: 9,
      scrollWheelZoom: true,
      zoomSnap: 0.1,
      dragging: true
    };

    // create the Leaflet map
    const map = L.map("map", options);

    //Could add the zoom control UI to the bottom right instead of the default attached 
    //But the default is still showing up although I deleted the "zoomControl" feature from the map options object
    // new L.control.zoom({
    // 	position: "bottomright"
    // }).addTo(map);

    // request tiles and add to map
    const tiles = L.tileLayer(
      "http://{s}.tile.stamen.com/toner-background/{z}/{x}/{y}.{ext}", {
        attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        subdomains: "abcd",
        ext: "png",
      }
    ).addTo(map);

    const counties = fetch("data/us-counties.json").then(function (r) {
        return r.json();
      });
      const states = fetch(
        "https://newmapsplus.github.io/assets/data/us_states_20m.geojson"
      ).then(function (r) {
        return r.json();
      });

      // AJAX request for GeoJSON data
      Promise.all([counties, states])
        .then(function (response) {
          console.log(response);
          const counties = response[0];
          const states = response[1];

        Papa.parse('data/us-unemployment-counties.csv', {

          download: true,
          header: true,
          complete: function (data) {

            // data is accessible to us here
            //console.log(data.data[0].STATE_FIP); //Return stateFIP code

            //Create function to join data and counties 
            processData(counties, data, states);
          }
        }); // end of Papa.parse()
      })
      .catch(function (error) {
        console.log(`Ruh roh! An error has occurred`, error);
      });

      
    // function processData(counties, data, states) {
    //   //Access and calculate new GEOID from the CSV files, then match GEOID between the json and the csv
    //   // loop through all the counties
    //   console.log('data:', data);
    //   console.log('counties:', counties);

    //   // Some of the GEOIDs are not joined, so test for them.
    //     // make empty array for for not joined GEOIDs
    //     let notJoined = [];

    //   //For each county feature
    //   for (let i of counties.features) {
    //     // set testing variable
    //     let joined = false;

    //     // for each of the CSV data rows
    //     for (let j of data.data) {
          
    //       //console.log(j.STATE_FIP + j.COUNTY_FIP);
    //       //declare new GEOID variable for the unemployment rates for the attribute join -- to join if GEOIDs match
    //       const newGEOID = j.STATE_FIP + j.COUNTY_FIP;
    //       j.csvGEOID = newGEOID;

    //       if (i.properties.GEOID === j.csvGEOID) {

    //         //DO THE TABLE JOIN
    //         i.properties = j;
    //         // If the above is true, then we have a join!
    //         joined = true;

    //         break;
    //       }
    //     }
    //     // Test to see if joined variable was not set to true
    //     if (!joined) {
    //         notJoined.push(i.properties.GEOID);
    //         // county.properties = ''
    //       }
    //   }
    //   console.log('notJoined:', notJoined);
      
    //   console.log('after:', counties);

    //   //Notes for "Classifying the data and mapping to colors"
    //   //in Model 2, we reclassdiied the data each time with a new data attribute
    //   //This is good for when we want different class breaks for different ranges and distributions of data (ie vacant housing data vs mortgage value data)
    //   //For this module, we want to create classification breaks one time since we're comparing year to year with the entire range of data over the years 
    //   //^^^This making the breaks ONE time across all months is what I want to do with the photoperiod maps

    //   //After we match up all of the FIPS codes, we can make an empty array to store all the data values
    //   // This is storing our range of values for making the classification breaks!!
    //   const rates = [];

    //   // iterate through all the counties
    //   counties.features.forEach(function (county) {

    //     // iterate through all the props of each county
    //     for (const prop in county.properties) {

    //       // if the attribute is a number and not one of the fips codes or name
    //       // if (prop != "COUNTY_FIP" && prop != "STATE_FIP" && prop != "NAME" && prop != "csvGEOID" && prop != "GEOID") {
    //         // push that attribute value into the array
    //         // OR
    //       if (prop.includes('20')) {
    //         rates.push(Number(county.properties[prop]));
    //       }
    //     }
    //   });
    //   // verify the result!
    //   console.log(rates);

    //   //Data Classification and Color Mapping with Chroma.js
    //   // create class breaks
    //   var breaks = chroma.limits(rates, 'q', 5);

    //   // create color generator function
    //   var colorize = chroma.scale(chroma.brewer.OrRd)
    //     .classes(breaks)
    //     .mode('lab');


    //   drawMap(counties, colorize, states);

    //   drawLegend(breaks, colorize);

    // } // end processData()

    // function drawMap(counties, colorize, states) { //COLORIZE as been PASSED through this function, not used within it
    //   // create Leaflet object with geometry data and add to map
    //   const dataLayer = L.geoJson(counties, {
    //     style: function (feature) {
    //       return {
    //         color: "black",
    //         weight: 1,
    //         fillOpacity: 1,
    //         fillColor: "#1f78b4"
    //       };
    //     },

    //     onEachFeature: function (feature, layer) {
    //       // when mousing over a layer
    //       layer.on("mouseover", function () {
    //         // change the stroke color and bring that element to the front
    //         layer
    //           .setStyle({
    //             color: "yellow",
    //           })
    //           .bringToFront();
    //       });

    //       // on mousing off layer
    //       layer.on("mouseout", function () {
    //         // reset the layer style to its original stroke color
    //         layer.setStyle({
    //           color: "black",
    //         });
    //       });
    //     },
    //   }).addTo(map);

    //   L.geoJson(states, {
    //       style: function (feature) {
    //         return {
    //           color: "#20282e", // Gray
    //           weight: 2,
    //           fillOpacity: 0,
    //           interactive: false,
    //         };
    //       },
    //     }).addTo(map);

    //   //Set Zoom/center to the Map's extent, but for whatever reason in the Lab03 Assignment
    //   //it is detecting the entire globe (the base map?) as the extent for the datalayer attribute 
    //   // map.fitBounds(dataLayer.getBounds(), {
    //   //   padding: [10, 10],
    //   // });

    //   //create the slider
    //   createSliderUI(dataLayer, colorize);

    //   //call to initially color the map with first timestamp 
    //   updateMap(dataLayer, colorize, '2001');

    // } // end drawMap()

    // function updateMap(dataLayer, colorize,currentYear) { 
    //   //Loop through each layer of the datalayer
    //   dataLayer.eachLayer(function (layer) {
    //     //Declare the shorthand for accessing each property
    //     const props = layer.feature.properties;
    //     //Set the stle of the map depending on the current years
    //     layer.setStyle({
    //       fillColor: colorize(Number(props[currentYear]))
    //     });
    //     let tooltip
    //     if (props['NAME']) {

    //       tooltip = `<b>${props['NAME']} </b> <br>
    //                     ${props[currentYear]}% unemployment`;

    //     } else {
    //       tooltip = `No data`;
    //     }
      
    //     //Bind tooltip to the layer
    //     layer.bindTooltip(tooltip, {
    //       sticky: true
    //     });
    //   });

    //   //Add the click event! The code is clunky but it works... :) 
    //   map.on('click', function (e){
    //     dataLayer.eachLayer(function(layer){
    //       //Add the click event
    //       const props = layer.feature.properties; //red-declare the shorthand for properties

    //       const tooltip = `<b>${props['NAME']} </b> <br> ${props[currentYear]}% unemployment`;
    //     });
    //   });

    // } // end updateMap()

    // function drawLegend(breaks, colorize) {
    //   // create a Leaflet control for the legend
    //   const legendControl = L.control({
    //     position: 'topright'
    //   });

    //   // when the control is added to the map
    //   legendControl.onAdd = function (map) {

    //     // create a new division element with class of 'legend' and return
    //     const legend = L.DomUtil.create('div', 'legend');
    //     return legend;
    //   };

    //   // add the legend control to the map
    //   legendControl.addTo(map);

    //   // select div and create legend title
    //   const legend = document.querySelector('.legend')
    //   legend.innerHTML = "<h3><span>2001</span> Unemployment Rates</h3><ul>";

    //   // loop through the break values
    //   for (let i = 0; i < breaks.length - 1; i++) {

    //     // determine color value 
    //     const color = colorize(breaks[i], breaks);

    //     // create legend item
    //     const classRange = `<li><span style="background:${color}"></span>
    //           ${breaks[i].toLocaleString()}&mdash;
    //           ${breaks[i + 1].toLocaleString()}% </li>`

    //     // append to legend unordered list item
    //     legend.innerHTML += classRange;
    //   }
    //   // close legend unordered list
    //   legend.innerHTML += `<li><span style="background:lightgray"></span>No data</li></ul>`;

    // } // end drawLegend()

    // function createSliderUI(dataLayer, colorize) {
    //   // create Leaflet control for the slider
    //   const sliderControl = L.control({
    //     position: 'bottomleft'
    //   });

    //   // when added to the map
    //   sliderControl.onAdd = function (map) {

    //     // select an existing DOM element with an id of "ui-controls"
    //     const slider = L.DomUtil.get("ui-controls");

    //     // disable scrolling of map while using controls
    //     //We don't want to slip the slippy map while trying to use the slider UI
    //     L.DomEvent.disableScrollPropagation(slider);

    //     // disable click events while using controls
    //     L.DomEvent.disableClickPropagation(slider);

    //     // return the slider from the onAdd method
    //     return slider;
    //   }

    //   // add the control to the map
    //   sliderControl.addTo(map);

    //   //Add the event listener for user interaction
    //   // select the form element
    //   const slider = document.querySelector(".year-slider");

    //   // listen for changes on input element
    //   slider.addEventListener("input", function (e) { // get the value of the selected option
    //     const currentYear = e.target.value; // update the map with current timestamp
    //     updateMap(dataLayer, colorize, currentYear); // update timestamp in legend heading
    //     document.querySelector(".legend h3 span").innerHTML = currentYear;
    //   });

    // } // end createSliderUI()


})();