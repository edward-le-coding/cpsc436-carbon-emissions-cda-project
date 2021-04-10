// Initialize dispatcher that is used to orchestrate events
const heatmapProvinceDispatcher = d3.dispatch('selectProvince');
const heatmapYearDispatcher = d3.dispatch('selectYear');


// Global objects
let uuid = 0;

let masterGeoData;
let masterHistData;

let heatmapData;
let heatmap;

let choropleth;
let chropolethData;

let barChartData;
let masterBarChartData;


const metricUnits = {
  CO2eq: 'million tn CO2',
  CO2eq_tn_per_person: 'tn CO2e emitted/person',
  CO2eq_tn_per_mil_GDP: 'tn CO2e emitted/$1 million CAD' // TODO add note about 2012  inflation-adjusted dollars
}

Promise.all([
    d3.json('data/canada_provinces.topo.json'),
    d3.csv('data/historical/historical_dataset.csv')
]).then(_data => {
  masterGeoData = _data[0];
  masterHistData = _data[1];

  // Convert columns to numerical values
  masterHistData.forEach(d => {
      Object.keys(d).forEach(attr => {
        d.UUID = uuid;
        d.Year = +d.Year;
        d.CO2eq = +d.CO2eq;
        d.GDP = +d.GDP;
        d.Population = +d.Population;
        d.CO2eq_tn_per_person = +d.CO2eq_tn_per_person;
        d.CO2eq_tn_per_mil_GDP = +d.CO2eq_tn_per_mil_GDP;
        uuid++;
      });
    });

   
  // Prepare heatmap data and initialize heatmap
  heatmapData = masterHistData.filter(d => d.Source == 'Total' &&d.Region != 'Canada') // TODO: remove filtering of Canada
  heatmap = new Heatmap({
    parentElement: '#heatmap'
  }, heatmapData, heatmapProvinceDispatcher, heatmapYearDispatcher);

  // Prepare choropleth data and initalize choropleth
  let defaultYearData = masterHistData.filter(d => d.Year == 1990);
  chropolethData = prepareChoroplethData(defaultYearData, masterGeoData);
  choropleth = new Choropleth({
    parentElement: '#choropleth'}, chropolethData);

  // Prepare stacked bar chart data and initialize stacked bar chart
  barChartData = masterHistData.filter(d => d.Source != 'Total' && d.Region === 'Canada')
  let province = ['Canada'];
  stackedBarChart = new StackedBarChart({ parentElement: '#stackedBarChart'}, barChartData, province);
  

  // Enable scrolling by creating a waypoint for each `step` container
  const waypoints = d3.selectAll('.step').each( function(d, stepIndex) {
    return new Waypoint({
      // `this` contains the current HTML element
      element: this,
      handler: function(direction) {
        // Check if the user is scrolling up or down
        const nextStep = direction === 'down' ? stepIndex : Math.max(0, stepIndex - 1)

        // Update visualization based on the current step
        stackedBarChart.goToStep(nextStep);
        heatmap.goToStep(nextStep);
        //choropleth.goToStep(nextStep);
      },
      // Trigger scroll event halfway up. Depending on the text length, 75% might be even better
      offset: '50%',
    });
  });
}).catch(error => console.error(error)); 

// Prepares the data for the choropleth
function prepareChoroplethData (histSubset, geoData){
  geoData.objects.provinces.geometries.forEach(d => {
    for (let i = 0; i < histSubset.length; i++) {
      if (d.properties.PRNAME == histSubset[i].region) {
        d.properties.UUID = histSubset[i].uuid;
        d.properties.Year = histSubset[i].Year;
        d.properties.CO2eq = histSubset[i].CO2eq;
        d.properties.GDP = histSubset[i].GDP;
        d.properties.Population = histSubset[i].Population;
        d.properties.CO2eq_tn_per_person = histSubset[i].CO2eq_tn_per_person;
        d.properties.CO2eq_tn_per_mil_GDP = histSubset[i].CO2eq_tn_per_mil_GDP;
      }
    }
  });
  return geoData
}

// Listeners for the metric controls
d3.select("#sort-control").on("change", function () {
  heatmap.config.sortOption = d3.select(this).property("value");
  heatmap.updateVis();
});

d3.select("#metric-selector").on("change", function(d) {
  let metricSelectorFilter = d3.select('input[name="metric-selector"]:checked').node().value
  heatmap.metric = metricSelectorFilter
  heatmap.updateVis();
})


/**
 * Event listener: toggle filter categories
 */
 d3.selectAll('.legend-btn').on('change', function() {

  property = d3.select(this).property("metric")


  // Toggle 'active' class
  d3.select(this).classed('active', !d3.select(this).classed('active'))

  // Check which categories are active
  let selectedMetricString = d3.select(this).attr('metric')
  console.log('selectedCategoryString', selectedMetricString)

  if (selectedMetricString != heatmap.metric) {
    d3.select(this).classed('active', !d3.select(this).classed('active'))
  }

  heatmap.metric = selectedMetricString
  heatmap.updateVis()

});

/**
 * Dispatcher waits for event
 * We update the data in the stacked bar chart based on the region selected in the heatmap
 */
heatmapProvinceDispatcher.on('selectProvince', selectedProvince => {
  barChartData = masterBarChartData.filter(d => d.Region === selectedProvince)
  stackedBarChart.data = barChartData;
  stackedBarChart.province = [selectedProvince];
  stackedBarChart.updateVis();
});

heatmapYearDispatcher.on('selectYear', selectedYear => {
  let stepIndex = selectedYear - 1990;
  stackedBarChart.goToStep(stepIndex);
  heatmap.goToStep(stepIndex);
  //choropleth.goToStep(stepIndex);

  //TODO: scroller on side needs to get into view
  // http://jsfiddle.net/walfo/cj8xynL0/1/
  // http://jsfiddle.net/DerekL/x3edvp4t/
  // https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollIntoView
  // https://stackoverflow.com/questions/13735912/anchor-jumping-by-using-javascript
  //

})





