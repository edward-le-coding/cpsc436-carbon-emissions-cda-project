// Initialize dispatcher that is used to orchestrate events
const heatmapProvinceDispatcher = d3.dispatch('selectProvince');
const heatmapYearDispatcher = d3.dispatch('selectYear');
const stackedBarChartYearDispatcher = d3.dispatch('selectYear');
const choroplethProvinceDispatcher = d3.dispatch('selectChoroplethProvince');
const heatmapDeselectProvinceDblClick = d3.dispatch('deselectHeatmapProvince');

const windowWidth = window.innerWidth, windowHeight = window.innerWidth;

// Global objects
let uuid = 0;

let masterGeoData;
let masterHistData;

let heatmap;
let heatmapData;

let choropleth;
let chropolethData;

let stackedBarChart;
let barChartData;

// Define global (historical) selected province
let currSelectedProvince = null;
let currSelectedYear = null;
let heatmapProvinceDoubleClickCounter = 0;

const metricUnits = {
  CO2eq: 'million tn CO2eq',
  CO2eq_tn_per_person: 'tn CO2eq/person',
  CO2eq_tn_per_mil_GDP: 'tn CO2eq/$1 million CAD (2012 CAD)'
}

const metricNames = {
  CO2eq: 'Absolute Emissions (million tn CO2eq)',
  CO2eq_tn_per_person: 'Emissions Intensity (tn CO2eq emitted/person)',
  CO2eq_tn_per_mil_GDP: 'Emissions Intensity (CO2eq per million $ GDP; 2012 dollars)'
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
  heatmapData = masterHistData.filter(d => d.Source == 'Total' &&d.Region != 'Canada')
  heatmap = new Heatmap({
    parentElement: '#heatmap',
    containerHeight: 0.175 * windowHeight,
    containerWidth: 0.85 * windowWidth
  }, heatmapData,
      heatmapProvinceDispatcher,
      heatmapYearDispatcher,
      heatmapDeselectProvinceDblClick);


  // Prepare choropleth data and initalize choropleth
  choroplethData = heatmapData; // Appears to be the same data I need at the moment
  choropleth = new Choropleth({
    parentElement: '#choropleth',
    containerHeight: 0.195 * windowHeight,
    containerWidth: 0.4 * windowWidth
    },
      choroplethData,
      masterGeoData,
      choroplethProvinceDispatcher);

  // Prepare stacked bar chart data and initialize stacked bar chart
  barChartData = masterHistData.filter(d => d.Source != 'Total' && d.Region === 'Canada')
  let province = ['Canada'];
  stackedBarChart = new StackedBarChart({ 
    parentElement: '#stackedBarChart',
    containerHeight: 0.195 * windowHeight,
    containerWidth: 0.55 * windowWidth},
  barChartData, province, stackedBarChartYearDispatcher);


  // Enable scrolling by creating a waypoint for each `step` container
  const waypoints = d3.selectAll('.step').each( function(d, stepIndex) {
    return new Waypoint({
      // `this` contains the current HTML element
      element: this,
      handler: function(direction) {
        // Check if the user is scrolling up or down
        const nextStep = direction === 'down' ? stepIndex : Math.max(0, stepIndex - 1)
        // Set window to be fixed vs absolute
        histGraphicsCont = document.getElementById("historicalGraphicsContainer");
        if (nextStep == 0){
          if(histGraphicsCont.hasAttribute('historicalIsFixed')){
            histGraphicsCont.classList.remove('historicalIsFixed');
          }
        } else{
          if(!histGraphicsCont.hasAttribute('historicalIsFixed')) {
            histGraphicsCont.classList.add('historicalIsFixed');
          }
        }
        // Update visualization based on the current step
        stackedBarChart.goToStep(nextStep);
        heatmap.goToStep(nextStep);
        choropleth.goToStep(nextStep);
      },
      // Trigger scroll event halfway up. Depending on the text length, 75% might be even better
      offset: '50%',
    });
  });
}).catch(error => console.error(error)); 

// Listeners for the metric controls
d3.select("#sort-control").on("change", function () {
  heatmap.config.sortOption = d3.select(this).property("value");
  heatmap.updateVis();
});

d3.select("#metric-selector").on("change", function(d) {
  let metricSelectorFilter = d3.select('input[name="metric-selector"]:checked').node().value
  // Change heatmap metric
  heatmap.metric = metricSelectorFilter;
  heatmap.updateVis();
  // Change choropleth metric
  choropleth.currMetric = metricSelectorFilter;
  choropleth.updateVis();
});

/**
 * Dispatcher waits for event
 * We update the data in the stacked bar chart based on the region selected in the heatmap
 */

function updateProvinceViews() {
  // Update heatmap
  heatmap.currSelectedProvince = currSelectedProvince;
  heatmap.updateVis();
  // Update choropleth
  choropleth.currSelectedProvince = currSelectedProvince;
  choropleth.updateVis();
  // Update barchart
  if (currSelectedProvince == null) {
    barChartData = masterHistData.filter(d => d.Region === 'Canada');
    stackedBarChart.data = barChartData;
    stackedBarChart.province = ['Canada'];
  } else {
    barChartData = masterHistData.filter(d => d.Region === currSelectedProvince);
    stackedBarChart.data = barChartData;
    stackedBarChart.province = [currSelectedProvince];
  }
  stackedBarChart.updateVis();
}

heatmapProvinceDispatcher.on('selectProvince', selectedProvince => {
  heatmapProvinceDoubleClickCounter = heatmapProvinceDoubleClickCounter + 1;
  // Update global field selected province (single click selects year)
 if (currSelectedProvince != selectedProvince){
    currSelectedProvince = selectedProvince;
    updateProvinceViews();
  }
});

choroplethProvinceDispatcher.on('selectChoroplethProvince', selectedProvince =>{
  // Update global field selected province
  if(currSelectedProvince == selectedProvince){
    currSelectedProvince = null;
  } else {
    currSelectedProvince = selectedProvince;
  }
  updateProvinceViews();
});
heatmapDeselectProvinceDblClick.on('deselectHeatmapProvince', deselectProvince =>{
  if (currSelectedProvince == deselectProvince){
    currSelectedProvince = null;
    updateProvinceViews();
  }
});
heatmapYearDispatcher.on('selectYear', selectedYear => {
  let stepIndex = selectedYear - 1990;
  // Reset click counter
  heatmapProvinceDoubleClickCounter = 0;
  document
      .getElementById('step'+stepIndex)
      .scrollIntoView({ behavior: 'smooth', block: 'center' });
});

stackedBarChartYearDispatcher.on('selectYear', selectedYear => {
  let stepIndex = selectedYear - 1990;
  document
      .getElementById('step'+stepIndex)
      .scrollIntoView({ behavior: 'smooth', block: 'center' });
});

document.addEventListener('scroll', function(e) {
  document.getElementById('tooltip').style.display = 'none';
});






