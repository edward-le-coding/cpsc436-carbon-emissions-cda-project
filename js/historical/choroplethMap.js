class Choropleth{
    // Basic constructor
    constructor(_config, _data) {
        this.config = {
            parentElement: _config.parentElement,
            containerWidth: _config.containerWidth || 640,
            containerHeight: _config.containerHeight || 480,
            margin: _config.margin || {top: 0, right: 0, bottom: 0, left: 0},
            projection: _config.projection || d3.geoConicConformal()
        }
        this.data = _data;
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

        // Add geographical projection
        vis.geoPath = d3.geoPath().projection(vis.config.projection);

        vis.updateVis();
    }
    updateVis(_data = null, _plottedVar = 'CO2eq'){
        let vis = this;
        // Update data (if provided)
        if(_data != null) {
            vis.data = _data;
        }
        // Convert data to topoJson
        const provinces = topojson.feature(vis.geoData, vis.geoData.objects.provinces);
        // Defines the scale of the projection so that the geometry fits within the SVG area
        vis.config.projection.fitSize([vis.width, vis.height], provinces);

        vis.renderVis(_plottedVar)
    }
    // Render visualization
    renderVis(_plottedVar = 'CO2eq') {
        let vis = this;

        // Append shapes of Canadian provinces
        const geoPath = vis.chart.selectAll('.geo-path')
            .data(provinces.features)
            .join('path')
            .attr('class', 'geo-path')
            .attr('d', vis.geoPath);

        // Add an additional layer on top of the map to show the province borders more clearly based on tutorial suggestions
        const geoBoundaryPath = vis.chart.selectAll('.geo-boundary-path')
            .data([topojson.mesh(vis.geoData, vis.geoData.objects.provinces)])
            .join('path')
            .attr('class', 'geo-boundary-path')
            .attr('d', vis.geoPath);
    }
}