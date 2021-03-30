 // Global objects
 let barChartData;
 
 
 
 /**
 * Load data from CSV file asynchronously and render stacked bar chart
 */
  d3.csv('data/historical/historical_dataset.csv').then(_data => {
    barChartData = _data;
    barChartData.forEach(d => {
      d.CO2eq = +d.CO2eq;
      d.Year = +d.Year;
    });

    console.log("barchart data)");
    console.log(barChartData);

    const origData = barChartData;

    // Initialize bar chart with default Canada
    barChartData = origData.filter(d => d.Region === 'Canada');
    let province = ['Canada'];

    stackedBarChart = new StackedBarChart({ parentElement: '#stackedBarChart'}, barChartData, province);
    stackedBarChart.updateVis();

    // add event listener
    document.getElementById('provinces-selector').addEventListener('click', updateViews);

    // helper function to update views
    function updateViews() {
      let selectedProvince = document.getElementById('provinces-selector').value;
      console.log("selectedProvince = ")
      console.log(selectedProvince);
      barChartData = origData.filter(d => d.Region === selectedProvince)
      stackedBarChart.data = barChartData;
      stackedBarChart.province = [selectedProvince];
      stackedBarChart.updateVis();
    }

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