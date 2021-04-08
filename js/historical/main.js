// Initialize dispatcher that is used to orchestrate events
const heatmapProvinceDispatcher = d3.dispatch('selectProvince');
const heatmapYearDispatcher = d3.dispatch('selectYear');


// Global objects
let barChartData;
let masterBarChartData;
 
let uuid = 0;
let subsetGeoChoropleth;
let subsetHistData;
let masterGeoData;
let masterHistData;
let heatmap;

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
  // Prepare default data
  subsetHistData =  masterHistData.filter(d => d.Year == 2018);
  
// Prepare heatmap data: only use data with 'Source' column == Total
  let heatmapData = masterHistData.filter(d=>d.Source=='Total'&&d.Region!='Canada') // TODO: remove filtering of Canada
  heatmap = new Heatmap({
    parentElement: '#heatmap'
  }, heatmapData, heatmapProvinceDispatcher, heatmapYearDispatcher);

  subsetGeoChoropleth = prepareGeoData(subsetHistData, masterGeoData);
  console.log('subsetGeoChoropleth', subsetGeoChoropleth)
  let histChoropleth = new Choropleth({
    parentElement: '#choropleth'}, subsetGeoChoropleth);


  // Initialize bar chart with default Canada
  masterBarChartData = masterHistData.filter(d=>d.Source!='Total')
  barChartData = masterBarChartData.filter(d => d.Region === 'Canada');
  let province = ['Canada'];

  stackedBarChart = new StackedBarChart({ parentElement: '#stackedBarChart'}, barChartData, province);
  stackedBarChart.updateVis();
  
  // Create a waypoint for each `step` container
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
      },
      // Trigger scroll event halfway up. Depending on the text length, 75% might be even better
      offset: '50%',
    });
  });
}).catch(error => console.error(error)); 

function prepareGeoData (histSubset, geoData){
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
  console.log("back in main for province");
  //console.log(selectedYear);
  barChartData = masterBarChartData.filter(d => d.Region === selectedProvince)
  stackedBarChart.data = barChartData;
  stackedBarChart.province = [selectedProvince];
  stackedBarChart.updateVis();
});

heatmapYearDispatcher.on('selectYear', selectedYear => {
  console.log("back in main for year");
  let stepIndex = selectedYear - 1990;
  console.log(selectedYear);
  console.log(stepIndex);

})





