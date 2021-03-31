/**
 * Load data from CSV file asynchronously and render charts
 */
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
]).then(data => {
      masterGeoData = data[0];
      masterHistData = data[1];
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
  }, heatmapData);

  subsetGeoChoropleth = prepareGeoData(subsetHistData, masterGeoData);
  let histChoropleth = new Choropleth({
    parentElement: '#choropleth',
    containerHeight: 149.6,
    containerWidth: 300},_data = subsetGeoChoropleth);
});

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

