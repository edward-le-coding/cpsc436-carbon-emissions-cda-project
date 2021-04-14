class Choropleth{
    // Basic constructor
    constructor(_config, _data, _geoData) {
        // Define settings for object (e.g. where it belongs, margins, width, height, etc).
        this.config = {
            parentElement: _config.parentElement,
            containerWidth: _config.containerWidth, //|| 400,
            containerHeight: _config.containerHeight, //|| 300,
            margin: _config.margin || {top: 50, right: 0, bottom: 10, left: 0},
            projection: _config.projection || d3.geoConicConformal().parallels([49, 77]).rotate([110, 0]),
            tooltipPadding: 15,
        }
        // Update data
        this.data = _data;
        this.geoData = _geoData;
        // Define default display data
        this.currYear = 2018;
        this.currMetric = 'CO2eq';
        this.initVis();
    }

    initVis() {
        let vis = this;

        // Pad chart by margins
        vis.width = vis.config.containerWidth - vis.config.margin.left - vis.config.margin.right;
        vis.height = vis.config.containerHeight - vis.config.margin.top - vis.config.margin.bottom;

        // Define SVG drawing area
        vis.svg = d3.select(vis.config.parentElement).append('svg')
            .attr('width', vis.config.containerWidth)
            .attr('height', vis.config.containerHeight);

        // Create space for chart
        vis.chart = vis.svg.append('g')
            .attr('transform', `translate(${vis.config.margin.left},${vis.config.margin.top})`);

        // Add title group
        vis.title = vis.svg.append('g')
            .attr('id', 'choropleth-title')
            .attr('transform', `translate(${vis.width/2}, 25)`)
            .append('text')
            .attr('class', 'stackedBarChart histSubVisTitle')
            .attr('text-anchor', 'middle');

        // Add geographical projection
        vis.geoPath = d3.geoPath().projection(vis.config.projection);
        // Create colour scales
        vis.colorScale = null;
        vis.colorScaleCO2eq = d3.scaleSequential()
            .interpolator(d3.interpolateGreens)
            .domain(d3.extent(vis.data, d => d.CO2eq));
        vis.colorScaleCO2PerCapita = d3.scaleSequential()
            .interpolator(d3.interpolateBlues)
            .domain(d3.extent(vis.data, d => d.CO2eq_tn_per_person));
        vis.colorScaleCO2eqPerMilGDP = d3.scaleSequential()
            .interpolator(d3.interpolateReds)
            .domain(d3.extent(vis.data, d => d.CO2eq_tn_per_mil_GDP));
        // Update view
        vis.updateVis();
    }

    updateVis(){
        let vis = this;
        // Create colour scale
        // Set color scales on update
        if (vis.currMetric == 'CO2eq') {
            // Carbon emissions
            vis.colorScale = vis.colorScaleCO2eq;
        } else if (vis.currMetric == 'CO2eq_tn_per_person') {
            // Intensity per capita
            vis.colorScale = vis.colorScaleCO2PerCapita
        } else {
            // Intensity by GDP
            vis.colorScale = vis.colorScaleCO2eqPerMilGDP;
        }
        // Create subset of data to be plotted
        let histSubset = vis.data.filter(d => d.Year == vis.currYear);
        // Bind Data Based on Year and Selected Units
        vis.geoData.objects.provinces.geometries.forEach(d => {
            for (let i = 0; i < histSubset.length; i++) {
                if (d.properties.PRENAME == histSubset[i].Region) {
                    d.properties.UUID = histSubset[i].uuid;
                    d.properties.Year = histSubset[i].Year;
                    d.properties.metric = histSubset[i][vis.currMetric];
                    d.properties.GDP = histSubset[i].GDP;
                    d.properties.Population = histSubset[i].Population;
                }
            }
        });
        //console.log(vis.geoData.objects.provinces.geometries);
        vis.renderVis();
    }

    // Render visualization
    renderVis() {
        let vis = this;
        // Convert data to topoJson
        const provinces = topojson.feature(vis.geoData, vis.geoData.objects.provinces);
        // Defines the projection scale so that the geometry fits within the SVG
        vis.config.projection.fitSize([vis.width, vis.height], provinces);
        // Append shapes of Canadian provinces
        const geoPath = vis.chart.selectAll('.geo-paths')
            .data(provinces.features)
            .join('path')
            .attr('class', 'geo-paths')
            .attr('d', vis.geoPath)
            .attr('fill', d=> {
                if(d.properties.metric) {
                    return vis.colorScale(d.properties.metric)
                } else {
                    return '#fff'
                }}
            ).on('mouseover', (event, d) => {
                const value = (d.properties.metric === null) ? 'No data available' : d.properties.metric;
                let units = metricUnits[vis.currMetric]
                d3.select('#tooltip')
                    .style('display', 'block')
                    .style('left', (event.pageX + vis.config.tooltipPadding) + 'px')
                    .style('top', (event.pageY + vis.config.tooltipPadding) + 'px')
                    .html(`
                  <div class='tooltip-label'>
                    Jurisdiction: ${d.properties.PRENAME}<br>
                    Year: ${d.properties.Year}
                  </div>
                  <div class="tooltip-label-normal">${value.toFixed(0)} ${units}</div>
                `);
            })
            .on('mouseleave', () => {
                d3.select('#tooltip').style('display', 'none');
            });

        // Add an additional layer on top of the map to show the province borders more clearly based on tutorial suggestions
        const geoBoundaryPath = vis.chart.selectAll('.geo-boundary-path')
            .data([topojson.mesh(vis.geoData, vis.geoData.objects.provinces)])
            .join('path')
            .attr('class', 'geo-boundary-path')
            .attr('d', vis.geoPath)
            .style("stroke", "black")
            .style("stroke-width", 1);

        // Add title
        vis.title
            .text(metricNames[vis.currMetric] + ", " + vis.currYear);
    }

    // Render new year's worth of data as a result of a trigger
    goToStep(stepIndex) {
        let vis = this;
        let baseYear = 1990;
        // Update year
        if(stepIndex == 0) {
            vis.currYear = 2018
        } else {
            vis.currYear = baseYear + stepIndex;
        }
        // Update vis
        vis.updateVis();
    }
}