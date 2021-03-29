 /**
 * Load data from CSV file asynchronously and render stacked bar chart
 */
  d3.csv('data/historical/historical_dataset.csv').then(_data => {
    barChartData = _data;
    barChartData.forEach(d => {
      d.CO2eq = +d.CO2eq;
      d.Year = +d.Year;
    });

    

    // Initialize bar chart with default Canada
    let defaultProvince = ['Canada'];

    // TODO: implement listeners to change province
    let province = defaultProvince;
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
      },
      // Trigger scroll event halfway up. Depending on the text length, 75% might be even better
      offset: '50%',
    });
  });


})
.catch(error => console.error(error));