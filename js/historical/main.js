/**
 * Load data from CSV file asynchronously and render charts
 */
let uuid = 0;
let subsetGeoChoropleth;
let subsetHistData;
let masterGeoData;
let masterHistData;
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
        d.CO2eq_tn_per_mil$GDP = +d.CO2eq_tn_per_mil$GDP;
        uuid++;
      });
    });
  // Prepare default data
  subsetHistData =  masterHistData.filter(d => d.Year == 2018);
  subsetGeoChoropleth = prepareGeoData(subsetHistData, masterGeoData);
  let histChoropleth = new Choropleth(_data = subsetGeoChoropleth);
});

/*
 * Todo:
 * - initialize views
 * - filter data
 * - listen to events and update views
 */
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
        d.properties.CO2eq_tn_per_mil$GDP = histSubset[i].CO2eq_tn_per_mil$GDP;
      }
    }
  });
  return geoData
}

