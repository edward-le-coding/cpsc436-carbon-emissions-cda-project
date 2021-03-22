/**
 * Load data from CSV file asynchronously and render charts
 */
let uuid = 0;
d3.csv('data/historical/historical_dataset.csv').then(data => {
  console.log('historical data', data)
  // Convert columns to numerical values
  data.forEach(d => {
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
});

/*
 * Todo:
 * - initialize views
 * - filter data
 * - listen to events and update views
 */
