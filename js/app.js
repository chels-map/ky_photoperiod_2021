(function () {
  // map options
  const options = {
    center: [37.8, -85.85],
    zoom: 7.3,
    scrollWheelZoom: true,
    zoomSnap: 0.1,
    dragging: true,
    zoomControl: false //This will toggle on/off the zoom control by default in the top-left corner 
  };

  // create the Leaflet map
  const map = L.map("map", options);

  //Could add the zoom control UI to the bottom right instead of the default attached 
  //But the default is still showing up although I deleted the "zoomControl" feature from the map options object
  new L.control.zoom({
    position: "bottomright"
  }).addTo(map);

  // request hillshade tiles and add to map
  const hillshade = L.tileLayer(
    "https://nyc3.digitaloceanspaces.com/astoria/tiles/ky-hillshade/{z}/{x}/{y}.jpg", {
      attribution: '&copy; UKy Geography',
      maxZoom: 14.4,
      minZoom: 2,
      opacity: 0.7,
      bounds: [
        [39.25995919, -89.80883737],
        [36.09998597, -81.77646750]
      ]
    }
  )
  // Remove base map on initial load but show on high zoom level
  map.on('zoom', () => {
    if (map.getZoom() > 7.5) {
      hillshade.addTo(map)
    } else {
      hillshade.removeFrom(map)
    }
  })

  // OTHER OPTIONAL BASEMAP
  const tiles = L.tileLayer(
    "http://{s}.tile.stamen.com/toner-background/{z}/{x}/{y}.{ext}", {
      attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      subdomains: "abcd",
      ext: "png",
      opacity: 0.4,
    }
  ).addTo(map);

  //Load GeoJson files
  const photoperiod = fetch("data/ky_photoperiod.geojson")
    .then(function (r) {
      return r.json();
    });

  // AJAX request for GeoJSON data
  Promise.all([photoperiod])
    .then(function (response) {
      //console.log(response); //Has all three geojsons in the one array

      processData(response)
    })
    .catch(function (error) {
      console.log(`Ruh roh! An error has occurred`, error);
    });

  function processData(data) {
    const photoperiod = data[0];

    const range = []
    //iterate through each hex
    photoperiod.features.forEach(function (photo) {
      //iterate through all the properties of each hex 
      //Add properties that are not the hex coordinates, so add all the photoperiod values
      for (const prop in photo.properties) {
        if (prop != "bottom" && prop != "top" && prop != "right" && prop != "left") {
          //CHANGE MINUTES TO HOURS/MINUTES?? FOR LABELS ETC. 
          range.push(Number(photo.properties[prop]));
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

    var colorize = chroma.scale(chroma.brewer.YlOrRd)
      .classes(breaks)
      .mode('lab');

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
          color: "", //No hex outlines
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
              color: "black",
            })
            .bringToFront();
        });

        // on mousing off layer
        layer.on("mouseout", function () {
          // reset the layer style to its original stroke color
          layer.setStyle({
            color: "",
          });
        });
      },
    }).addTo(map);

    //ADD THE SLIDER UI 
    createSliderUI(dataLayer, colorize)

    //Eventually call UpdateMap HERE 
    updateMap(dataLayer, colorize, '1');

  } // End updateMap

  function updateMap(dataLayer, colorize, currentMonth) {
    //Loop through each layer of the datalayer
    dataLayer.eachLayer(function (layer) {
      //Declare the shorthand for accessing each property
      const props = layer.feature.properties;
      //Set the style of the map depending on the current years
      layer.setStyle({
        fillColor: colorize(Number(props[currentMonth])),
        fillOpacity: .5 //Add opacity so we can see the hillshade basemap
      });

      let tooltip
      if (props[currentMonth]) {
        //Take the photoperiod property and apply a label as hours, minutes format 
        //console.log(props[currentMonth]);
        const hours = Math.floor((props[currentMonth]) / 60);
        //console.log(hours);
        const minutes = Math.round((props[currentMonth] - (hours * 60)));
        //console.log(minutes);
        tooltip = `<b>Average photoperiod:</b> ${hours} hours, ${minutes} minutes`;
      }

      //Bind tooltip to the layer
      layer.bindTooltip(tooltip, {
        sticky: true
      });
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
    legend.innerHTML = "<h3> <span>January</span> <br> <br> Average Photoperiod <br></h3>";

    // loop through the break values
    for (let i = 0; i < breaks.length - 1; i++) {

      // determine color value 
      const color = colorize(breaks[i], breaks);

      var hours1 = (Math.floor(breaks[i] / 60));
      var hours2 = (Math.floor(breaks[i + 1] / 60));

      var minutes1 = (Math.floor(breaks[i] - hours1 * 60));
      var minutes2 = (Math.floor(breaks[i + 1] - hours2 * 60));
      console.log(hours1, minutes1);
      console.log(hours2, minutes2);

      const classRange = `<li><span style="background:${color}"></span>
              ${(hours1).toLocaleString()}h, ${(minutes1).toLocaleString()}m &mdash;
              ${(hours2).toLocaleString()}h, ${(minutes2).toLocaleString()}m</li>`



      // append to legend unordered list item
      legend.innerHTML += classRange;
    } // close legend unordered list


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

      //CHANGE LABEL TO BE THE NAME OF THE MONTH AND NOT THE NUMBER!!

      const currentMonth = e.target.value; // update the map with current timestamp

      updateMap(dataLayer, colorize, currentMonth);

      //Add legend labes for months
      var month = "";

      if (currentMonth == 1) {
        month = "January"
      } else
      if (currentMonth == 2) {
        month = "February"
      } else
      if (currentMonth == 3) {
        month = "March"
      } else
      if (currentMonth == 4) {
        month = "April"
      } else
      if (currentMonth == 5) {
        month = "May"
      } else
      if (currentMonth == 6) {
        month = "June"
      } else
      if (currentMonth == 7) {
        month = "July"
      } else
      if (currentMonth == 8) {
        month = "August"
      } else
      if (currentMonth == 9) {
        month = "September"
      } else
      if (currentMonth == 10) {
        month = "October"
      } else
      if (currentMonth == 11) {
        month = "November"
      } else
      if (currentMonth == 12) {
        month = "December"
      }
      document.querySelector(".legend h3 span").innerHTML = month;
    });

  } // end createSliderUI()


})();