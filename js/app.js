(function (){
    // map options
    const options = {
      center: [37.8, -85.85],
      zoom: 7,
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

    // request hillshade tiles and add to map
    const hillshade = L.tileLayer(
      "https://nyc3.digitaloceanspaces.com/astoria/tiles/ky-hillshade/{z}/{x}/{y}.jpg", {
        attribution: '&copy; UKy Geography',
          maxZoom: 14.4,
          minZoom: 2,
          bounds: [
              [39.25995919, -89.80883737],
              [36.09998597, -81.77646750]
          ]
      }
    ).addTo(map);

    // request tiles and add to map
    const tiles = L.tileLayer(
      "http://{s}.tile.stamen.com/toner-background/{z}/{x}/{y}.{ext}", {
        attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        subdomains: "abcd",
        ext: "png",
        opacity: 0.3,
      }
    ).addTo(map);

    //Load GeoJson files
    const photoperiod = fetch("data/ky_photoperiod.geojson")
    .then(function (r) {
        return r.json();
      });

    // const counties = fetch("data/ky_counties_housing.json")
    //   .then(function (r) {
    //     return r.json();
    //   });

    //   const state = fetch("data/ky_state_boundary.geojson")
    //   .then(function (r) {
    //     return r.json();
    //   });

      // AJAX request for GeoJSON data
      //OK SO THIS WORKS, BUT IDK HOW TO GET IT TO LET ME PASS THE DATA TO A FUNCTION
      Promise.all([photoperiod])
        .then(function (response) {
          //console.log(response); //Has all three geojsons in the one array

          processData(response)
      })
      .catch(function (error) {
        console.log(`Ruh roh! An error has occurred`, error);
      });

      //console.log(photoperiod) //"promise pending" when logged from heres

      function processData(data){
        const photoperiod = data[0];
        // const counties = data[1]; 
        // const state = data[2];

        console.log(photoperiod.features[0].properties.top);
        console.log(photoperiod.features[0].properties);
        
        const range = []
        //iterate through each hex
        photoperiod.features.forEach (function (photo) {
          //iterate through all the properties of each hex 
          //Add properties that are not the hex coordinates, so add all the photoperiod values
          for (const prop in photo.properties){
            if (prop != "bottom" && prop != "top" && prop != "right" && prop != "left"){
              //CHANGE MINUTES TO HOURS/MINUTES?? FOR LABELS ETC. 
              range.push (Number(photo.properties[prop]));
            }
          }
        });

        //console.log(range); //Yay it works!

        //oh LOL chroma.js does this FOR me 
        var min = Math.min.apply(Math, range); //Annual minimum, 566
        var max = Math.max.apply(Math, range); //Annual maximum, 894
        var difference = Math.round(max - min); //Returns 328 minutes; calculate and round the difference between the max and minimum 
        
        //Generate color classification breaks with Chroma.js CHROMA URL https://colorbrewer2.org/#type=sequential&scheme=YlOrRd&n=3
        var breaks = chroma.limits(range, 'q', 20);

        var colorize = chroma.scale(chroma.brewer.YlOrRd) //Hmm and how to make this slightly opaque so the basemap comes through?
          .classes(breaks)
          .mode('lab');
        
        //console.log(breaks);

        drawMap(data, colorize) 

        drawLegend(breaks, colorize)
      }

      function drawMap(data, colorize) { 

        const photoperiod = data[0];
        //const counties = data[1];
        // const state = data[2];

        // EXAMPLE FROM LESSON: create Leaflet object with geometry data and add to map
        const dataLayer = L.geoJson(photoperiod, {
          style: function (feature) {
            return {
              color: "black",
              weight: 1,
              fillOpacity: 1,
              fillColor: "#1f78b4"
            };
          },
          onEachFeature: function (feature, layer) {
            // when mousing over a layer
            layer.on("mouseover", function () {
              // change the stroke color and bring that element to the front
              layer
                .setStyle({
                  color: "yellow",
                })
                .bringToFront();
            });

            // on mousing off layer
            layer.on("mouseout", function () {
              // reset the layer style to its original stroke color
              layer.setStyle({
                color: "black",
              });
            });
          },
        }).addTo(map);

        //ADD THE SLIDER UI 
        createSliderUI(dataLayer, colorize)

        //Eventually call UpdateMap HERE 
        updateMap(dataLayer, colorize, '1');

      }// End updateMap COLORIZE as been PASSED through this function, not used within it
      
   

      //Set Zoom/center to the Map's extent, but for whatever reason in the Lab03 Assignment
      //it is detecting the entire globe (the base map?) as the extent for the datalayer attribute 
      // map.fitBounds(dataLayer.getBounds(), {
      //   padding: [10, 10],
      // });

    
    function updateMap(dataLayer, colorize,currentYear) { 
      //Loop through each layer of the datalayer
      dataLayer.eachLayer(function (layer) {
        //Declare the shorthand for accessing each property
        const props = layer.feature.properties;
        //Set the style of the map depending on the current years
        layer.setStyle({
          fillColor: colorize(Number(props[currentYear]))
        });
      //   let tooltip
      //   if (props['NAME']) {

      //     tooltip = `<b>${props['NAME']} </b> <br>
      //                   ${props[currentYear]}% unemployment`;

      //   } else {
      //     tooltip = `No data`;
      //   }
      
      //   //Bind tooltip to the layer
      //   layer.bindTooltip(tooltip, {
      //     sticky: true
      //   });
      // });

      // //Add the click event! The code is clunky but it works... :) 
      // map.on('click', function (e){
      //   dataLayer.eachLayer(function(layer){
      //     //Add the click event
      //     const props = layer.feature.properties; //red-declare the shorthand for properties

      //     const tooltip = `<b>${props['NAME']} </b> <br> ${props[currentYear]}% unemployment`;
      //   });
       });

    } // end updateMap()

    function drawLegend(breaks, colorize) {
      // create a Leaflet control for the legend
      const legendControl = L.control({
        position: 'bottomleft'
      });

      // when the control is added to the map
      legendControl.onAdd = function (map) {
        // create a new division element with class of 'legend' and return
        const legend = L.DomUtil.create('div', 'legend');
        return legend;
      };

      // add the legend control to the map
      legendControl.addTo(map);

      // select div and create legend title
      const legend = document.querySelector('.legend')
      legend.innerHTML = "<h3>Month Average Photoperiod (minutes)</h3><ul>";

      // loop through the break values
      for (let i = 0; i < breaks.length - 1; i++) {

        // determine color value 
        const color = colorize(breaks[i], breaks);

        // create legend item
        const classRange = `<li><span style="background:${color}"></span>
              ${breaks[i].toLocaleString()}&mdash;
              ${breaks[i + 1].toLocaleString()} </li>`

        // append to legend unordered list item
        legend.innerHTML += classRange;
      }
      // close legend unordered list
      legend.innerHTML += `<li><span style="background:lightgray"></span>No data</li></ul>`;

    } // end drawLegend()

    function createSliderUI(dataLayer, colorize) {
      // create Leaflet control for the slider
      const sliderControl = L.control({
        position: 'bottomleft'
      });

      // when added to the map
      sliderControl.onAdd = function (map) {

        // select an existing DOM element with an id of "ui-controls"
        const slider = L.DomUtil.get("ui-controls");

        // disable scrolling of map while using controls
        //We don't want to slip the slippy map while trying to use the slider UI
        L.DomEvent.disableScrollPropagation(slider);

        // disable click events while using controls
        L.DomEvent.disableClickPropagation(slider);

        // return the slider from the onAdd method
        return slider;
      }

      // add the control to the map
      sliderControl.addTo(map);

      //Add the event listener for user interaction
      // select the form element
      const slider = document.querySelector(".month-slider");

      // listen for changes on input element
      slider.addEventListener("input", function (e) { // get the value of the selected option
        const currentYear = e.target.value; // update the map with current timestamp
        updateMap(dataLayer, colorize, currentYear); // update timestamp in legend heading
        document.querySelector(".legend h3 span").innerHTML = currentYear;
      });

    } // end createSliderUI()


})();