d3.csv("./data/global-air-pollution-dataset.csv").then(data => {
  const countryData = {};
  data.forEach(d => {
      const country = d["Country"];
      const aqi = +d["AQI Value"]; // Convert AQI Value to a number
      if (!countryData[country]) {
          countryData[country] = { totalAQI: 0, count: 0 };
      }
      countryData[country].totalAQI += aqi;
      countryData[country].count += 1;
  });

  // Calculate average AQI for each country
  Object.keys(countryData).forEach(country => {
      countryData[country] = countryData[country].totalAQI / countryData[country].count;

      if (country === "Russian Federation") {
        countryData["Russia"] = countryData[country];
      }
  });

  renderMap(countryData);
});

function renderMap(countryData) {
  // Set reduced map dimensions
  const width = 1400;
  const height = 800;

  // Define color scale with thresholds based on AQI categories
  const colorScale = d3.scaleThreshold()
      .domain([50, 100, 150, 200, 300]) // Thresholds based on AQI levels
      .range(["#cbeef3", "#f49cbb", "#f26a8d", "#dd2d4a", "#880d1e", "#720026"]);

  // Define the map projection and path generator
  const projection = d3.geoMercator()
      .scale(120) // Adjust scale to shrink map size
      .translate([width / 2, height / 2]); // Center the map

  const path = d3.geoPath().projection(projection);

  // Append an SVG to the div with id "viz1"
  const svg = d3.select("#viz1")
      .append("svg")
      .attr("width", width)
      .attr("height", height);

  // Load and render the GeoJSON world map
  d3.json("countries.geojson").then(worldData => {
    svg.append("g")
      .selectAll("path")
      .data(worldData.features)
      .enter().append("path")
      .attr("d", path)
      .attr("fill", d => {
        const countryName = d.properties.ADMIN;
        const value = countryData[countryName];
        return value ? colorScale(value) : "#ccc"; // Default color for countries without data
      })
      .attr("stroke", "#333")
      .attr("stroke-width", 0.5)
      .on("mouseover", function(event, d) {
        const countryName = d.properties.ADMIN;
        const aqi = countryData[countryName] || "No data";
        const aqiFormatted = (typeof aqi === 'number') ? aqi.toFixed(2) : aqi;

        const tooltip = d3.select("#tooltip");
        tooltip
            .style("visibility", "visible")
            .html(`<strong>${countryName}</strong><br>AQI: ${aqiFormatted}`)
            .style("top", (event.pageY + 10) + "px")
            .style("left", (event.pageX + 10) + "px");
      })
      .on("mouseout", function() {
        const tooltip = d3.select("#tooltip");
        tooltip.style("visibility", "hidden");
      });

    addLegend(svg);
  });
}

function addLegend(svg) {
  const legend = svg.append("g").attr("transform", `translate(250, 400)`);

  const legendData = [
      { color: "#cbeef3", label: "Good (0–50)" },
      { color: "#f49cbb", label: "Moderate (51–100)" },
      { color: "#f26a8d", label: "Unhealthy for Sensitive Groups (101–150)" },
      { color: "#dd2d4a", label: "Unhealthy (151–200)" },
      { color: "#880d1e", label: "Very Unhealthy (201–300)" },
      { color: "#720026", label: "Hazardous (301+)" },
  ];

  const rectSize = 20; // Reduced rectangle size for smaller legend

  legend.selectAll("rect")
      .data(legendData)
      .enter().append("rect")
      .attr("x", 0)
      .attr("y", (d, i) => i * (rectSize + 5))
      .attr("width", rectSize)
      .attr("height", rectSize)
      .attr("fill", d => d.color)

  legend.selectAll("text")
      .data(legendData)
      .enter().append("text")
      .attr("x", rectSize + 10)
      .attr("y", (d, i) => i * (rectSize + 5) + rectSize / 1.5)
      .style("font-size", "12px")
      .text(d => d.label);
}
