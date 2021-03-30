/**
 * Load data from CSV file asynchronously and render charts
 */
d3.csv('data/historical/historical_dataset.csv').then(data => {
  console.log('historical data', data)
  // Convert columns to numerical values
  data.forEach(d => {
    Object.keys(d).forEach(attr => {
    });
  });

  data.sort((a,b) => a.label - b.label);

});

/*
 * Todo:
 * - initialize views
 * - filter data
 * - listen to events and update views
 */
